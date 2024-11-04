
# MikroTik Configuration Manager

**MikroTik Configuration Manager** is a TypeScript-based Express application that provides an API for managing and configuring a MikroTik router. This project allows users to perform tasks like creating VPNs, configuring tunnels, listing IP profiles, and more through a set of well-defined endpoints. It also provides HTML pages for convenient access to certain functionalities, making it easier for non-technical users to interact with the router's configuration.

## Features

- **User Management**: Authenticate, validate, and list user IP profiles.
- **VPN Configuration**: Set up VPN connections with ease.
- **Tunnel Management**: Configure and manage tunnels for secure data transfer.
- **Static HTML Pages**: User-friendly HTML pages for quick access to common functionalities.
- **MikroTik Integration**: Connect directly to MikroTik routers to apply configurations securely.
- **Environment-based Configuration**: Set environment variables for customizable settings.

## Getting Started

### Prerequisites

- Node.js (>=14.x)
- MikroTik Router (configured with necessary permissions)
- MikroTik API access

### Installation

1. Clone the repository:
   ```bash
   git clone git@github.com:amirrezagh75/mikrotik-configuration-manager.git
   ```
2. Install dependencies:
   ```bash
   cd mikrotik-configuration-manager
   npm install
   ```

3. Set up environment variables in a `.env` file:
   ```dotenv
   PORT=3000
   ```

### Usage

1. Start the server:
   ```bash
   npm start
   ```
2. Access the API at `http://localhost:<PORT>`.

### API Endpoints

- **User Routes**
  - `GET /user/`: Welcome message.
  - `POST /user/ipList`: Retrieve a list of IP addresses by user.
  - `POST /user/validate`: Validate user connection to MikroTik.
  - `POST /user/createTunnel`: Create a secure tunnel.
  - `POST /user/createVpn`: Set up a VPN.
  - `POST /user/profileList`: List user profiles.
  - `POST /user/createSecrete`: Create a secret for additional security.

- **Static Pages**
  - `GET /vpn`: Access the VPN setup page.
  - `GET /tunnel`: Access the tunnel configuration page.
  - `GET /machine`: Machine setup interface.
  - `GET /secrete`: Secret creation page.

## Project Structure

- **app.ts**: Main entry point; configures and starts the Express server.
- **modules/**: Contains the core modules for interacting with MikroTik, user management, and other functionalities.
- **services/**: Implements the logic for each route.
- **types/**: Type definitions and schema validations.

## Contributing

Contributions are welcome! Please feel free to submit a pull request or open an issue if you find a bug or have a feature request.

---
