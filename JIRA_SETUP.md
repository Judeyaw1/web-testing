# Jira Integration Setup Guide

This guide explains how to connect this repository to Jira for issue tracking and commit linking.

## Option 1: GitHub App for Jira (Recommended)

### Steps:
1. **In Jira:**
   - Go to **Settings** (gear icon) → **Applications** → **DVCS accounts**
   - Click **Link GitHub account**
   - Authorize Jira to access your GitHub account
   - Select the repository: `Judeyaw1/web-testing`
   - Jira will automatically sync commits, branches, and pull requests

2. **Benefits:**
   - Automatic linking of commits to Jira issues
   - Branch and PR information visible in Jira
   - Development panel shows all git activity

## Option 2: Smart Commits (Quick Setup)

Use Jira issue keys in commit messages to automatically link commits to issues.

### Commit Message Format:
```
PROJ-123 Add new feature

or

PROJ-123 #comment Fixed the bug
PROJ-123 #time 2h 30m
PROJ-123 #resolve
```

### Example:
```bash
git commit -m "GRAB-123 Add Reach meeting delete test"
```

### Setup:
1. In Jira, go to **Settings** → **Applications** → **DVCS accounts**
2. Link your GitHub account
3. Enable "Smart Commits" in the repository settings

## Option 3: Azure DevOps + Jira Integration

Since you're using Azure Pipelines, you can integrate with Jira:

1. **Install Jira extension in Azure DevOps:**
   - Go to Azure DevOps marketplace
   - Search for "Jira Integration"
   - Install the extension

2. **Configure in Azure DevOps:**
   - Go to Project Settings → Service connections
   - Add Jira connection
   - Enter your Jira URL and credentials

3. **Link in Pipeline:**
   - The pipeline can automatically update Jira issues on test results

## Current Configuration

Your repository is configured to use smart commits. When you commit, include Jira issue keys in your commit messages:

```bash
# Example commit with Jira issue
git commit -m "GRAB-123 Add delete meeting test functionality"
```

## Verification

After setup, verify the integration:
1. Make a commit with a Jira issue key (e.g., `GRAB-123`)
2. Check the Jira issue - you should see the commit linked
3. Check the Development panel in Jira issue

## Troubleshooting

- **Commits not appearing in Jira:**
  - Verify the repository is linked in Jira DVCS settings
  - Check that commit messages include valid Jira issue keys
  - Ensure the Jira project key matches (e.g., GRAB, PROJ, etc.)

- **Azure Pipeline not updating Jira:**
  - Verify service connection is configured
  - Check pipeline logs for Jira API errors
  - Ensure Jira credentials have proper permissions


