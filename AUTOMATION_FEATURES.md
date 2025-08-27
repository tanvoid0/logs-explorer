# Automation Pipeline System

The Logs Explorer application now includes a powerful automation pipeline system that allows you to create, manage, and execute YAML-based automation workflows for your projects. This system is inspired by GitHub Actions and Jenkins, providing a flexible and extensible way to automate common development tasks.

## Features

### 🎯 **Pipeline Management**
- **Visual Pipeline Editor**: Create and edit pipelines using an intuitive visual interface
- **YAML-based Configuration**: Pipelines are stored in YAML format for version control and portability
- **Template System**: Use pre-built templates for common workflows (React, Node.js, Python, etc.)
- **Framework-specific Pipelines**: Create pipelines that are specific to certain frameworks or technologies

### ⚙️ **Execution Engine**
- **Step-by-step Execution**: Execute pipeline steps sequentially or in parallel
- **Dependency Management**: Define step dependencies to control execution order
- **Conditional Execution**: Run steps based on conditions (e.g., framework type, environment)
- **Timeout and Retry Logic**: Configure timeouts and automatic retries for robust execution

### 📊 **Progress Tracking**
- **Real-time Progress**: Monitor pipeline execution with live progress indicators
- **Step-level Tracking**: Track individual step progress and status
- **Execution History**: View past executions and their results
- **Logging and Output**: Capture and display step output and logs

### 🔧 **Variable System**
- **Runtime Variables**: Automatically provided variables (PROJECT_NAME, PROJECT_PATH, etc.)
- **Custom Variables**: Define your own variables with validation and defaults
- **Environment Variables**: Set step-specific environment variables
- **Variable Substitution**: Use variables in commands and scripts

### 🛡️ **Validation and Security**
- **Pipeline Validation**: Validate pipeline syntax and dependencies before execution
- **Input Validation**: Validate variable inputs with patterns and constraints
- **Security Checks**: Safe execution environment with proper isolation

## Getting Started

### 1. Accessing the Automation System

1. Navigate to **Settings** in the application
2. Click on the **Automation Pipelines** section
3. You'll see the pipeline management interface

### 2. Creating Your First Pipeline

#### Option A: Use a Template
1. Click **Create Pipeline**
2. Choose a template from the available options
3. Customize the pipeline name and variables
4. Save and start using

#### Option B: Create from Scratch
1. Click **Create Pipeline**
2. Fill in the basic information:
   - **Name**: Descriptive name for your pipeline
   - **Description**: What the pipeline does
   - **Version**: Pipeline version (e.g., 1.0.0)
   - **Framework**: Optional framework filter
   - **Category**: Pipeline category (build, test, deploy, etc.)
   - **Tags**: Keywords for organization

### 3. Adding Variables

Variables make your pipeline configurable:

```yaml
variables:
  - name: BUILD_ENV
    description: Build environment
    type: select
    defaultValue: production
    required: true
    options: [development, staging, production]
  
  - name: DOCKER_IMAGE_NAME
    description: Docker image name
    type: string
    defaultValue: my-app
    required: true
```

### 4. Defining Steps

Steps are the actions your pipeline performs:

```yaml
steps:
  - id: install-deps
    name: Install Dependencies
    type: command
    command: npm install
    workingDirectory: .
    timeout: 300
    
  - id: run-tests
    name: Run Tests
    type: command
    command: npm test
    dependsOn: [install-deps]
    timeout: 120
```

## Step Types

### Command Steps
Execute shell commands:
```yaml
- id: build
  name: Build Application
  type: command
  command: npm run build
  workingDirectory: ./frontend
  timeout: 300
```

### Script Steps
Execute custom scripts:
```yaml
- id: data-processing
  name: Process Data
  type: script
  scriptType: python
  script: |
    import pandas as pd
    df = pd.read_csv('data.csv')
    # Process data...
  timeout: 600
```

### Validation Steps
Validate conditions:
```yaml
- id: check-coverage
  name: Check Test Coverage
  type: validation
  validation:
    type: command_success
    value: "npm run test:coverage"
    message: "Test coverage must be above 80%"
```

### Wait Steps
Add delays or wait for conditions:
```yaml
- id: wait-deployment
  name: Wait for Deployment
  type: wait
  timeout: 300
```

### Notification Steps
Send notifications:
```yaml
- id: notify-success
  name: Notify Success
  type: notification
  message: "Pipeline completed successfully"
```

## Runtime Variables

The system automatically provides these variables during execution:

| Variable | Description | Example |
|----------|-------------|---------|
| `PROJECT_NAME` | Name of the project | "my-react-app" |
| `PROJECT_PATH` | Full path to project directory | "/home/user/projects/my-react-app" |
| `PROJECT_NAMESPACE` | Kubernetes namespace | "default" |
| `PROJECT_FRAMEWORK` | Project framework | "react" |
| `PROJECT_DEPLOYMENT` | Kubernetes deployment name | "my-app-deployment" |
| `USER_HOME` | User's home directory | "/home/user" |
| `CURRENT_TIMESTAMP` | Current timestamp | "2024-01-15T10:30:00Z" |
| `PIPELINE_ID` | Pipeline identifier | "pipeline_123456" |
| `PIPELINE_NAME` | Pipeline name | "Build and Deploy" |

## Using Pipelines in Projects

### 1. Access Project Pipelines
1. Navigate to a project's detail page
2. Scroll down to the **Automation Pipelines** section
3. View available pipelines for the project

### 2. Execute a Pipeline
1. Click **Run Pipeline** on any available pipeline
2. Configure variables if needed
3. Review runtime variables
4. Click **Run Pipeline** to start execution

### 3. Monitor Execution
- View real-time progress in the execution modal
- See step-by-step status updates
- Monitor logs and output
- Cancel execution if needed

## Example Pipelines

### React Build & Deploy Pipeline
```yaml
name: React Build & Deploy
description: Build and deploy a React application
version: 1.0.0
framework: react
variables:
  - name: BUILD_ENV
    type: select
    defaultValue: production
    options: [development, staging, production]
  - name: DOCKER_IMAGE_NAME
    type: string
    defaultValue: my-react-app
steps:
  - id: install-deps
    name: Install Dependencies
    type: command
    command: npm install
  - id: run-tests
    name: Run Tests
    type: command
    command: npm test
    dependsOn: [install-deps]
  - id: build
    name: Build Application
    type: command
    command: npm run build
    dependsOn: [run-tests]
  - id: docker-build
    name: Build Docker Image
    type: command
    command: docker build -t ${DOCKER_IMAGE_NAME}:latest .
    dependsOn: [build]
  - id: deploy
    name: Deploy to Kubernetes
    type: command
    command: kubectl apply -f k8s/
    dependsOn: [docker-build]
```

### Node.js API Testing Pipeline
```yaml
name: Node.js API Testing
description: Comprehensive testing for Node.js API
version: 1.0.0
framework: node
variables:
  - name: TEST_ENV
    type: select
    defaultValue: test
    options: [test, integration, e2e]
steps:
  - id: install-deps
    name: Install Dependencies
    type: command
    command: npm install
  - id: lint
    name: Lint Code
    type: command
    command: npm run lint
    dependsOn: [install-deps]
  - id: unit-tests
    name: Unit Tests
    type: command
    command: npm run test:unit
    dependsOn: [lint]
  - id: integration-tests
    name: Integration Tests
    type: command
    command: npm run test:integration
    dependsOn: [unit-tests]
    condition: TEST_ENV === "integration"
```

## Advanced Features

### Conditional Execution
Use conditions to run steps only when certain criteria are met:
```yaml
- id: deploy-staging
  name: Deploy to Staging
  type: command
  command: kubectl apply -f k8s/staging/
  condition: BUILD_ENV === "staging"
```

### Parallel Execution
Run steps in parallel by setting `parallel: true`:
```yaml
- id: test-unit
  name: Unit Tests
  type: command
  command: npm run test:unit
  parallel: true
  
- id: test-integration
  name: Integration Tests
  type: command
  command: npm run test:integration
  parallel: true
```

### Step Dependencies
Control execution order with dependencies:
```yaml
- id: step1
  name: Step 1
  type: command
  command: echo "Step 1"
  
- id: step2
  name: Step 2
  type: command
  command: echo "Step 2"
  dependsOn: [step1]
  
- id: step3
  name: Step 3
  type: command
  command: echo "Step 3"
  dependsOn: [step1, step2]
```

### Environment Variables
Set step-specific environment variables:
```yaml
- id: build
  name: Build with Environment
  type: command
  command: npm run build
  environment:
    NODE_ENV: production
    BUILD_VERSION: ${PIPELINE_ID}
```

## Best Practices

### 1. Pipeline Design
- **Keep pipelines focused**: Each pipeline should have a single responsibility
- **Use meaningful names**: Clear, descriptive names for pipelines and steps
- **Add descriptions**: Document what each pipeline and step does
- **Version your pipelines**: Use semantic versioning for pipeline changes

### 2. Variable Management
- **Use descriptive variable names**: Make variables self-documenting
- **Provide defaults**: Set sensible default values for variables
- **Validate inputs**: Use validation rules for critical variables
- **Document variables**: Add descriptions for all variables

### 3. Step Organization
- **Logical grouping**: Group related steps together
- **Clear dependencies**: Explicitly define step dependencies
- **Error handling**: Include validation and error-checking steps
- **Timeout configuration**: Set appropriate timeouts for each step

### 4. Security Considerations
- **Validate inputs**: Always validate user inputs and variables
- **Limit permissions**: Run steps with minimal required permissions
- **Sanitize commands**: Avoid executing user-provided commands directly
- **Log sensitive data**: Be careful not to log sensitive information

## Troubleshooting

### Common Issues

1. **Pipeline not appearing in project**
   - Check if the pipeline framework matches the project framework
   - Ensure the pipeline is saved and active

2. **Step execution fails**
   - Check the step logs for error messages
   - Verify the command or script syntax
   - Ensure required dependencies are available

3. **Variable substitution not working**
   - Use `${VARIABLE_NAME}` syntax for variable substitution
   - Ensure variables are defined and have values
   - Check for typos in variable names

4. **Timeout errors**
   - Increase the timeout value for long-running steps
   - Consider breaking complex steps into smaller ones
   - Check if the step is waiting for external resources

### Getting Help

- Check the step logs for detailed error messages
- Review the pipeline validation results
- Test individual steps manually to isolate issues
- Use the pipeline editor's validation features

## Future Enhancements

The automation system is designed to be extensible. Future enhancements may include:

- **Scheduled Pipelines**: Run pipelines on a schedule (cron jobs)
- **Webhook Triggers**: Trigger pipelines from external events
- **Pipeline Templates**: More pre-built templates for common workflows
- **Advanced Notifications**: Email, Slack, and other notification channels
- **Pipeline Sharing**: Share pipelines between users and teams
- **Advanced Analytics**: Detailed execution analytics and metrics
- **Pipeline Versioning**: Full version control for pipelines
- **Integration APIs**: REST APIs for external integration

---

The automation pipeline system provides a powerful foundation for automating your development workflows. Start with simple pipelines and gradually build more complex automation as your needs grow.

