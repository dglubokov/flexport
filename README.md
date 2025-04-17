# FlexPort - Web-Based File Manager

FlexPort is a distributed web-based file manager that allows you to:
- Browse and manage files in your system
- Transfer files via FTP/SFTP
- Upload files from URLs
- Monitor file transfer sessions

## Features

- **Direct file operations**: Upload, download, and delete files
- **Server-to-server transfers**: Transfer files from FTP and SFTP servers
- **URL-based uploads**: Download files from URLs to your server
- **Transfer monitoring**: Track all file transfer operations
- **User authentication**: Secure access using PAM authentication
- **Modern UI**: Responsive interface with list and tile views

## Installation & Deployment

### Option 1: Docker Deployment (Recommended)

Prerequisites:
- Docker and Docker Compose installed on your system

Steps:
1. Clone the repository to your server:
   ```bash
   git clone https://github.com/yourusername/flexport.git
   cd flexport
   ```

2. Create the Docker configuration files in the project root:
   - `backend-dockerfile` for the backend
   - `frontend-dockerfile` for the frontend
   - `docker-compose.yml` for orchestration

3. Start the application:
   ```bash
   docker compose up -d
   ```

4. Access the application at `http://yourserver:3000`

### Option 2: Manual Deployment

#### Backend Setup

Prerequisites:
- Python 3.12+

Steps:
1. Install dependencies:
   ```bash
   cd backend
   uv venv .venv
   source .venv/bin/activate
   uv pip install -r requirements.txt
   ```

2. Run the server:
   ```bash
   uvicorn main:app --host 0.0.0.0 --port 8009 --reload
   ```

#### Frontend Setup

Prerequisites:
- Node.js 18+
- npm

Steps:
1. Install dependencies:
   ```bash
   cd frontend
   npm install
   ```

2. For development:
   ```bash
   npm run dev
   ```

3. For production:
   ```bash
   npm run build
   ```
   Then serve the `dist` directory with a web server like nginx.

### Option 3: Systemd Service

Use this method to run FlexPort as a system service:

1. Copy the project to `/opt/flexport`:
   ```bash
   sudo cp -r flexport/ /opt/
   ```

2. Install the systemd service file:
   ```bash
   sudo cp flexport.service /etc/systemd/system/
   ```

3. Enable and start the service:
   ```bash
   sudo systemctl daemon-reload
   sudo systemctl enable flexport
   sudo systemctl start flexport
   ```

4. Check the service status:
   ```bash
   sudo systemctl status flexport
   ```

## FTP/SFTP Module Testing

To test the FTP/SFTP functionality:

1. Set up a test FTP server:
   - For quick testing, you can use `pyftpdlib`:
     ```bash
     pip install pyftpdlib
     python -m pyftpdlib -p 21
     ```

2. Configure your test credentials:
   - Host: `localhost` (or your server IP)
   - Username: (as configured on your FTP server)
   - Password: (as configured on your FTP server)
   - Port: 21 for FTP, 22 for SFTP

3. Test file transfers:
   - Create a test directory with sample files
   - Try to browse and download these files using FlexPort
   - Monitor the session progress in the Sessions panel

## Security Recommendations

1. **JWT Secret Key**:
   - Always change the default JWT secret key in production
   - Set it as an environment variable in `.env` file or Docker configuration

2. **CORS Configuration**:
   - Restrict CORS to only trusted domains in the production environment

3. **Run as Non-root User**:
   - When using the systemd service, consider running as a non-root user with appropriate permissions

4. **Secure the API Endpoints**:
   - Add rate limiting to prevent brute force attacks
   - Consider adding IP-based restrictions for sensitive endpoints

## Troubleshooting

### Common Issues

1. **Authentication Fails**:
   - Ensure the user exists on the system
   - Check PAM configuration
   - Verify permissions

2. **File Operations Fail**:
   - Check file and directory permissions
   - Ensure the service has access to the requested paths

3. **FTP/SFTP Connection Issues**:
   - Verify the host is reachable (try ping or telnet)
   - Check credentials and port settings
   - Ensure the server allows the requested operations

### Logs

- When running with systemd, check logs with:
  ```bash
  journalctl -u flexport
  ```

- In Docker, check logs with:
  ```bash
  docker logs flexport-backend
  docker logs flexport-frontend
  ```

## Contributing

Contributions are welcome! Here are some current areas for improvement:

- Add comprehensive test suite
- Enhance security features
- Implement file search functionality
- Add file preview for common formats
- Improve drag and drop interface

## License

FlexPort is licensed under the MIT License. See the LICENSE file for details.
