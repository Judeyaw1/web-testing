#!/bin/bash

# Jira Smart Commit Helper Script
# Usage: ./scripts/jira-commit.sh GRAB-123 "Your commit message"

if [ $# -lt 2 ]; then
    echo "Usage: $0 <JIRA-ISSUE-KEY> <commit-message>"
    echo "Example: $0 GRAB-123 \"Add delete meeting test\""
    exit 1
fi

JIRA_KEY=$1
COMMIT_MSG=$2

# Construct commit message with Jira key
FULL_MSG="${JIRA_KEY} ${COMMIT_MSG}"

# Check if there are staged changes
if [ -z "$(git diff --cached --name-only)" ]; then
    echo "No staged changes. Staging all changes..."
    git add -A
fi

# Commit with Jira key
git commit -m "$FULL_MSG"

echo "✅ Committed with Jira issue: $JIRA_KEY"
echo "📝 Message: $COMMIT_MSG"


