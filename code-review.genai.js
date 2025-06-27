// Code review script using GenAIScript
// Requires GITHUB_TOKEN environment variable to be set

const changes = await git.diff({ staged: true });

defDiff("CODE_CHANGES", changes);

$`## Role
You are a senior developer whose job is to review code changes and provide meaningful feedback.

## Task
Review <CODE_CHANGES>, point out possible mistakes or bad practices, and provide suggestions for improvement.
- Be specific about what's wrong and why it's wrong
- Reference proper coding standards and best practices
- Be brief to get your point across
- Look for security vulnerabilities and performance issues
- Check for proper error handling and code organization
- Suggest improvements for readability and maintainability
`;