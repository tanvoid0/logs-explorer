#!/usr/bin/env node

/**
 * Script to create sample data for testing the documents interface
 * This will populate the database with sample projects and documents
 */

import { invoke } from '@tauri-apps/api/core';

async function createSampleData() {
  console.log('🚀 Creating Sample Data');
  console.log('========================\n');

  try {
    // Step 1: Create sample projects
    console.log('📁 Step 1: Creating sample projects...\n');
    
    const sampleProjects = [
      {
        name: 'Sample Project',
        path: '/tmp/sample-project',
        framework: 'Node.js',
        deployment: null
      },
      {
        name: 'Documentation',
        path: '/tmp/documentation',
        framework: 'Vue.js',
        deployment: null
      }
    ];

    const createdProjectIds = [];
    
    for (let i = 0; i < sampleProjects.length; i++) {
      const project = sampleProjects[i];
      console.log(`Creating project ${i + 1}/${sampleProjects.length}: "${project.name}"`);
      
      try {
        const projectId = await invoke('add_project', {
          name: project.name,
          path: project.path,
          framework: project.framework,
          deployment: project.deployment
        });
        
        createdProjectIds.push(projectId);
        console.log(`✅ Created project: ${project.name} (ID: ${projectId})\n`);
      } catch (error) {
        console.log(`⚠️  Project "${project.name}" might already exist, using existing ID`);
        // Try to get existing project ID
        try {
          const projects = await invoke('get_all_projects');
          const existingProject = projects.find(p => p.name === project.name);
          if (existingProject) {
            createdProjectIds.push(existingProject.id);
            console.log(`✅ Using existing project: ${project.name} (ID: ${existingProject.id})\n`);
          } else {
            console.log(`❌ Could not find project "${project.name}"`);
            createdProjectIds.push(i + 1); // Fallback ID
          }
        } catch (getError) {
          console.log(`❌ Could not get projects: ${getError}`);
          createdProjectIds.push(i + 1); // Fallback ID
        }
      }
    }

    // Step 2: Create sample documents
    console.log('📝 Step 2: Creating sample documents...\n');
    
    const sampleDocuments = [
      {
        title: 'Getting Started Guide',
        content: `# Getting Started Guide

Welcome to Logs Explorer! This guide will help you get started with the application.

## Features

- **Document Management**: Create, organize, and manage your knowledge base
- **Project Organization**: Group documents by projects
- **Smart Tagging**: Use tags to categorize and find documents quickly
- **Markdown Support**: Write rich content with markdown formatting

## Quick Start

1. Create your first document
2. Add tags to organize content
3. Group documents by projects
4. Use the search to find what you need

Happy documenting!`,
        tags: ['guide', 'documentation', 'getting-started'],
        projectId: createdProjectIds[0] || 1
      },
      {
        title: 'API Reference',
        content: `# API Reference

This document contains the API reference for Logs Explorer.

## Endpoints

### Documents
- \`GET /documents\` - Get all documents
- \`POST /documents\` - Create a new document
- \`PUT /documents/:id\` - Update a document
- \`DELETE /documents/:id\` - Delete a document

### Projects
- \`GET /projects\` - Get all projects
- \`POST /projects\` - Create a new project

## Authentication

All API endpoints require authentication via JWT tokens.`,
        tags: ['api', 'reference', 'documentation'],
        projectId: createdProjectIds[0] || 1
      },
      {
        title: 'Project Planning Notes',
        content: `# Project Planning Notes

## Current Sprint Goals

- [ ] Implement document search functionality
- [ ] Add document versioning
- [ ] Improve tag management
- [ ] Add export functionality

## Future Features

- Document templates
- Collaborative editing
- Advanced search filters
- Document analytics

## Notes

Remember to update the roadmap document with any new ideas or requirements.`,
        tags: ['planning', 'notes', 'project'],
        projectId: createdProjectIds[1] || 2
      },
      {
        title: 'Design System',
        content: `# Design System

## Color Palette

- **Primary**: Blue (#3B82F6)
- **Secondary**: Purple (#8B5CF6)
- **Success**: Green (#10B981)
- **Warning**: Yellow (#F59E0B)
- **Error**: Red (#EF4444)

## Typography

- **Headings**: Inter, sans-serif
- **Body**: Inter, sans-serif
- **Monospace**: JetBrains Mono

## Components

- Buttons
- Input fields
- Cards
- Modals
- Navigation`,
        tags: ['design', 'ui', 'documentation'],
        projectId: createdProjectIds[1] || 2
      },
      {
        title: 'Tutorial: Creating Your First Document',
        content: `# Tutorial: Creating Your First Document

Follow this step-by-step guide to create your first document in Logs Explorer.

## Step 1: Navigate to Documents

Click on the "Documents" section in the sidebar.

## Step 2: Create New Document

Click the "+ New" button in the top right corner.

## Step 3: Fill in Details

- **Title**: Enter a descriptive title
- **Content**: Write your content in markdown
- **Tags**: Add relevant tags (comma-separated)
- **Project**: Select a project (optional)

## Step 4: Save

Click "Create Document" to save your document.

## Next Steps

- Edit your document
- Add more tags
- Organize into projects
- Share with team members`,
        tags: ['tutorial', 'guide', 'getting-started'],
        projectId: null
      }
    ];

    for (let i = 0; i < sampleDocuments.length; i++) {
      const doc = sampleDocuments[i];
      console.log(`Creating document ${i + 1}/${sampleDocuments.length}: "${doc.title}"`);
      
      try {
        const result = await invoke('create_document', {
          title: doc.title,
          content: doc.content,
          projectId: doc.projectId,
          deploymentId: null,
          tags: doc.tags
        });
        
        console.log(`✅ Created: ${doc.title} (ID: ${result.id})\n`);
      } catch (error) {
        console.error(`❌ Failed to create document "${doc.title}":`, error);
      }
    }
    
    console.log('🎉 Sample data creation completed!');
    console.log('📱 Refresh your documents page to see the documents in the sidebar.');
    console.log('\n📊 Summary:');
    console.log(`   - Projects created: ${createdProjectIds.length}`);
    console.log(`   - Documents created: ${sampleDocuments.length}`);
    console.log(`   - Tags available: guide, documentation, getting-started, api, reference, planning, notes, project, design, ui, tutorial`);
    
  } catch (error) {
    console.error('❌ Error creating sample data:', error);
    console.error('\nMake sure the Tauri app is running and the database is accessible.');
  }
}

// Run the script
createSampleData();
