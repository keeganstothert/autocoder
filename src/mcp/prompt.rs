use octocrab::models::issues::Issue;

pub fn create_prompt(issue: &Issue, style_guide: &str) -> String {
    let prompt = format!(
        r#"GitHub Issue #{}: {}

Description:
{}

Style Guide:
{}

Please analyze this issue and implement the necessary changes following these requirements:
1. Follow the style guide precisely
2. Write high quality, well-tested code
3. Provide clear commit messages
4. Include inline documentation where appropriate
5. Add or update tests as needed

Format your response in GitHub-flavored markdown with these sections:
## Changes Overview
[Brief description of the changes]

## Files Modified
- `[filename]`: [description of changes]

## Code Changes
```[language]
[code changes with inline comments]
```

## Test Coverage
- [Added/modified tests]
- [Test coverage details]

## Commit Message
```
[commit message following conventional commits]
```

Note: Use proper markdown formatting with code blocks, lists, and headers. Ensure code blocks specify the language for syntax highlighting."#,
        issue.number,
        issue.title,
        issue.body.as_ref().map(String::as_str).unwrap_or_default(),
        style_guide
    );

    prompt
}

pub fn format_pr_body(response: String) -> String {
    format!(
        r#"This PR was automatically generated by the Autocode action.

{}

---
<sub>🤖 Generated by [Autocode](.github/actions/autocode)</sub>"#,
        response
    )
}
