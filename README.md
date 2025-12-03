![ScrAPI logo](https://raw.githubusercontent.com/DevEnterpriseSoftware/scrapi-sdk-dotnet/master/icon_small.png)

# ScrAPI MCP Server

[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![NPM Downloads](https://img.shields.io/npm/dm/@deventerprisesoftware/scrapi-mcp)](https://www.npmjs.com/package/@deventerprisesoftware/scrapi-mcp)
[![Docker Pulls](https://img.shields.io/docker/pulls/deventerprisesoftware/scrapi-mcp)](https://hub.docker.com/r/deventerprisesoftware/scrapi-mcp)
[![smithery badge](https://smithery.ai/badge/@DevEnterpriseSoftware/scrapi-mcp)](https://smithery.ai/server/@DevEnterpriseSoftware/scrapi-mcp)

MCP server for using [ScrAPI](https://scrapi.tech) to scrape web pages.

ScrAPI is your ultimate web scraping solution, offering powerful, reliable, and easy-to-use features to extract data from any website effortlessly.

<a href="https://glama.ai/mcp/servers/@DevEnterpriseSoftware/scrapi-mcp">
  <img width="380" height="200" src="https://glama.ai/mcp/servers/@DevEnterpriseSoftware/scrapi-mcp/badge" alt="ScrAPI Server MCP server" />
</a>

## Tools

1. `scrape_url_html`
   - Use a URL to scrape a website using the ScrAPI service and retrieve the result as HTML.
     Use this for scraping website content that is difficult to access because of bot detection, captchas or even geolocation restrictions.
     The result will be in HTML which is preferable if advanced parsing is required.
   - Input: `url` (string)
   - Returns: HTML content of the URL

2. `scrape_url_markdown`
   - Use a URL to scrape a website using the ScrAPI service and retrieve the result as Markdown.
     Use this for scraping website content that is difficult to access because of bot detection, captchas or even geolocation restrictions.
     The result will be in Markdown which is preferable if the text content of the webpage is important and not the structural information of the page.
   - Input: `url` (string)
   - Returns: Markdown content of the URL

## Setup

### API Key (optional)

Optionally get an API key from the [ScrAPI website](https://scrapi.tech).

Without an API key you will be limited to one concurrent call and twenty free calls per day with minimal queuing capabilities.

### Cloud Server

The ScrAPI MCP Server is also available in the cloud over SSE at https://api.scrapi.tech/mcp/sse and streamable HTTP at https://api.scrapi.tech/mcp

Cloud MCP servers are not widely supported yet but you can access this directly from your own custom clients or use [MCP Inspector](https://github.com/modelcontextprotocol/inspector) to test it. There is currently no facility to pass through your API key when connecting to the cloud MCP server.

![MCP-Inspector](https://raw.githubusercontent.com/DevEnterpriseSoftware/scrapi-mcp/master/img/mcp-inspector.jpg)

### Usage with Claude Desktop

Add the following to your `claude_desktop_config.json`:

#### Docker

```json
{
  "mcpServers": {
    "ScrAPI": {
      "command": "docker",
      "args": [
        "run",
        "-i",
        "--rm",
        "-e",
        "SCRAPI_API_KEY",
        "deventerprisesoftware/scrapi-mcp"
      ],
      "env": {
        "SCRAPI_API_KEY": "<YOUR_API_KEY>"
      }
    }
  }
}
```

#### NPX

```json
{
  "mcpServers": {
    "ScrAPI": {
      "command": "npx",
      "args": [
        "-y",
        "@deventerprisesoftware/scrapi-mcp"
      ],
      "env": {
        "SCRAPI_API_KEY": "<YOUR_API_KEY>"
      }
    }
  }
}
```

![Claude-Desktop](https://raw.githubusercontent.com/DevEnterpriseSoftware/scrapi-mcp/master/img/claude-desktop.jpg)

## Build

Docker build:

```bash
docker build -t deventerprisesoftware/scrapi-mcp -f Dockerfile .
```

## License

This MCP server is licensed under the MIT License. This means you are free to use, modify, and distribute the software, subject to the terms and conditions of the MIT License. For more details, please see the LICENSE file in the project repository.