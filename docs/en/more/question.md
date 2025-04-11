# Frequently Asked Questions

## Do I need to manually distinguish between production/development environments?

The plugin automatically detects whether it's in production or development environment based on the bundler's internal parameters. It only takes effect in the development environment, so users don't need to manually distinguish between production and development environments.

## Using in Micro-Frontend

If you encounter issues where DOM selection and navigation don't work in micro-frontend child projects, you need to apply `code-inspector-plugin` in both the main project and child projects for normal operation.

## SSR Scenarios

Most conventional framework SSR projects are supported by default. For custom-rendered SSR projects, please join our user group for adaptation guidance.

## Eslint Plugin Errors

If this plugin causes Eslint Plugin errors, please add `enforcePre: false` to your `code-inspector-plugin` configuration.

## Using in WSL or Dev Containers

You can find the vscode remote address in WSL by using the `which code` command. The address should look something like this:

```bash
/home/xxx/.vscode-server/bin/dc96b837cf6bb4af9cd736aa3af08cf8279f7685/bin/remote-cli/code
```

Then create a `.env.local` file in your project root directory and add the following content (replace with your vscode remote address):

```bash
CODE_EDITOR=/home/xxx/.vscode-server/bin/dc96b837cf6bb4af9cd736aa3af08cf8279f7685/bin/remote-cli/code
```

## Other Issues

If you encounter any unresolvable issues, please [join our user group](/more/feedback) or submit an [issue](https://github.com/zh-lx/code-inspector/issues) on GitHub. Most problems can be resolved through group consultation.
