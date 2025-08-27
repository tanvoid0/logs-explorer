import type { PipelineTemplate } from '$lib/types/automation';

export const defaultPipelineTemplates: PipelineTemplate[] = [
  {
    id: 'react-build-deploy',
    name: 'React Build & Deploy',
    description: 'Build and deploy a React application with Docker',
    category: 'build',
    framework: 'react',
    template: {
      name: 'React Build & Deploy',
      description: 'Build and deploy a React application with Docker',
      version: '1.0.0',
      framework: 'react',
      tags: ['react', 'build', 'deploy', 'docker'],
      variables: [
        {
          name: 'BUILD_ENV',
          description: 'Build environment (development, staging, production)',
          type: 'select',
          defaultValue: 'production',
          required: true,
          options: ['development', 'staging', 'production']
        },
        {
          name: 'DOCKER_IMAGE_NAME',
          description: 'Name for the Docker image',
          type: 'string',
          defaultValue: 'my-react-app',
          required: true
        },
        {
          name: 'DOCKER_TAG',
          description: 'Docker image tag',
          type: 'string',
          defaultValue: 'latest',
          required: true
        }
      ],
      steps: [
        {
          id: 'install-deps',
          name: 'Install Dependencies',
          description: 'Install npm dependencies',
          type: 'command',
          command: 'npm install',
          workingDirectory: '.',
          timeout: 300
        },
        {
          id: 'run-tests',
          name: 'Run Tests',
          description: 'Run the test suite',
          type: 'command',
          command: 'npm test',
          workingDirectory: '.',
          timeout: 120,
          dependsOn: ['install-deps']
        },
        {
          id: 'build-app',
          name: 'Build Application',
          description: 'Build the React application',
          type: 'command',
          command: 'npm run build',
          workingDirectory: '.',
          timeout: 300,
          dependsOn: ['run-tests']
        },
        {
          id: 'build-docker',
          name: 'Build Docker Image',
          description: 'Build Docker image for deployment',
          type: 'command',
          command: 'docker build -t ${DOCKER_IMAGE_NAME}:${DOCKER_TAG} .',
          workingDirectory: '.',
          timeout: 600,
          dependsOn: ['build-app']
        },
        {
          id: 'deploy',
          name: 'Deploy to Kubernetes',
          description: 'Deploy the application to Kubernetes',
          type: 'command',
          command: 'kubectl apply -f k8s/',
          workingDirectory: '.',
          timeout: 300,
          dependsOn: ['build-docker']
        }
      ],
      metadata: {
        author: 'System',
        created: new Date().toISOString(),
        updated: new Date().toISOString(),
        category: 'build'
      }
    },
    tags: ['react', 'build', 'deploy', 'docker']
  },
  {
    id: 'node-api-test',
    name: 'Node.js API Testing',
    description: 'Run tests for a Node.js API application',
    category: 'test',
    framework: 'node',
    template: {
      name: 'Node.js API Testing',
      description: 'Run comprehensive tests for a Node.js API application',
      version: '1.0.0',
      framework: 'node',
      tags: ['node', 'api', 'test', 'jest'],
      variables: [
        {
          name: 'TEST_ENV',
          description: 'Test environment',
          type: 'select',
          defaultValue: 'test',
          required: true,
          options: ['test', 'integration', 'e2e']
        },
        {
          name: 'COVERAGE_THRESHOLD',
          description: 'Minimum code coverage threshold (0-100)',
          type: 'number',
          defaultValue: 80,
          required: true,
          validation: {
            min: 0,
            max: 100,
            message: 'Coverage threshold must be between 0 and 100'
          }
        }
      ],
      steps: [
        {
          id: 'install-deps',
          name: 'Install Dependencies',
          description: 'Install npm dependencies',
          type: 'command',
          command: 'npm install',
          workingDirectory: '.',
          timeout: 300
        },
        {
          id: 'lint-code',
          name: 'Lint Code',
          description: 'Run ESLint to check code quality',
          type: 'command',
          command: 'npm run lint',
          workingDirectory: '.',
          timeout: 120,
          dependsOn: ['install-deps']
        },
        {
          id: 'unit-tests',
          name: 'Run Unit Tests',
          description: 'Run unit tests with Jest',
          type: 'command',
          command: 'npm run test:unit',
          workingDirectory: '.',
          timeout: 300,
          dependsOn: ['lint-code']
        },
        {
          id: 'integration-tests',
          name: 'Run Integration Tests',
          description: 'Run integration tests',
          type: 'command',
          command: 'npm run test:integration',
          workingDirectory: '.',
          timeout: 600,
          dependsOn: ['unit-tests'],
          condition: 'TEST_ENV === "integration"'
        },
        {
          id: 'e2e-tests',
          name: 'Run E2E Tests',
          description: 'Run end-to-end tests',
          type: 'command',
          command: 'npm run test:e2e',
          workingDirectory: '.',
          timeout: 900,
          dependsOn: ['integration-tests'],
          condition: 'TEST_ENV === "e2e"'
        },
        {
          id: 'coverage-report',
          name: 'Generate Coverage Report',
          description: 'Generate and check code coverage',
          type: 'command',
          command: 'npm run test:coverage',
          workingDirectory: '.',
          timeout: 300,
          dependsOn: ['unit-tests']
        }
      ],
      metadata: {
        author: 'System',
        created: new Date().toISOString(),
        updated: new Date().toISOString(),
        category: 'test'
      }
    },
    tags: ['node', 'api', 'test', 'jest']
  },
  {
    id: 'python-data-pipeline',
    name: 'Python Data Pipeline',
    description: 'Run a Python data processing pipeline',
    category: 'data',
    framework: 'python',
    template: {
      name: 'Python Data Pipeline',
      description: 'Process data using Python with pandas and scikit-learn',
      version: '1.0.0',
      framework: 'python',
      tags: ['python', 'data', 'pandas', 'ml'],
      variables: [
        {
          name: 'INPUT_FILE',
          description: 'Path to input data file',
          type: 'string',
          defaultValue: 'data/input.csv',
          required: true
        },
        {
          name: 'OUTPUT_FILE',
          description: 'Path to output data file',
          type: 'string',
          defaultValue: 'data/output.csv',
          required: true
        },
        {
          name: 'MODEL_TYPE',
          description: 'Type of ML model to use',
          type: 'select',
          defaultValue: 'random_forest',
          required: true,
          options: ['random_forest', 'linear_regression', 'svm', 'neural_network']
        }
      ],
      steps: [
        {
          id: 'setup-env',
          name: 'Setup Python Environment',
          description: 'Create and activate virtual environment',
          type: 'script',
          scriptType: 'bash',
          script: `
#!/bin/bash
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
          `,
          workingDirectory: '.',
          timeout: 300
        },
        {
          id: 'data-validation',
          name: 'Validate Input Data',
          description: 'Validate the input data file',
          type: 'script',
          scriptType: 'python',
          script: `
import pandas as pd
import sys
import os

input_file = os.environ.get('INPUT_FILE', 'data/input.csv')

if not os.path.exists(input_file):
    print(f"Error: Input file {input_file} not found")
    sys.exit(1)

try:
    df = pd.read_csv(input_file)
    print(f"Data validation successful. Shape: {df.shape}")
    print(f"Columns: {list(df.columns)}")
except Exception as e:
    print(f"Error reading data: {e}")
    sys.exit(1)
          `,
          workingDirectory: '.',
          timeout: 120,
          dependsOn: ['setup-env']
        },
        {
          id: 'data-processing',
          name: 'Process Data',
          description: 'Clean and process the data',
          type: 'script',
          scriptType: 'python',
          script: `
import pandas as pd
import numpy as np
import os

input_file = os.environ.get('INPUT_FILE', 'data/input.csv')
output_file = os.environ.get('OUTPUT_FILE', 'data/output.csv')

# Read data
df = pd.read_csv(input_file)

# Clean data
df = df.dropna()
df = df.drop_duplicates()

# Feature engineering
df['processed'] = df.apply(lambda x: x.sum(), axis=1)

# Save processed data
df.to_csv(output_file, index=False)
print(f"Data processing complete. Output saved to {output_file}")
          `,
          workingDirectory: '.',
          timeout: 300,
          dependsOn: ['data-validation']
        },
        {
          id: 'train-model',
          name: 'Train ML Model',
          description: 'Train a machine learning model',
          type: 'script',
          scriptType: 'python',
          script: `
import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestRegressor
from sklearn.linear_model import LinearRegression
from sklearn.svm import SVR
from sklearn.neural_network import MLPRegressor
import joblib
import os

model_type = os.environ.get('MODEL_TYPE', 'random_forest')
input_file = os.environ.get('OUTPUT_FILE', 'data/output.csv')

# Load data
df = pd.read_csv(input_file)

# Prepare features and target
X = df.drop('target', axis=1, errors='ignore')
y = df['target'] if 'target' in df.columns else df.iloc[:, -1]

# Split data
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

# Select model
models = {
    'random_forest': RandomForestRegressor(),
    'linear_regression': LinearRegression(),
    'svm': SVR(),
    'neural_network': MLPRegressor()
}

model = models.get(model_type, RandomForestRegressor())

# Train model
model.fit(X_train, y_train)

# Save model
joblib.dump(model, 'model.pkl')
print(f"Model trained and saved: {model_type}")
          `,
          workingDirectory: '.',
          timeout: 600,
          dependsOn: ['data-processing']
        }
      ],
      metadata: {
        author: 'System',
        created: new Date().toISOString(),
        updated: new Date().toISOString(),
        category: 'data'
      }
    },
    tags: ['python', 'data', 'pandas', 'ml']
  }
];

