# flexport
Flexport is Distributed Web-Based File Manager


## Development

### Frontend

**Install dependencies**

```bash
cd frontend
npm install
```

**Run development server**

```bash
npm run dev
```

### Backend

**Install dependencies**

```bash
cd backend
pip install -r requirements.txt
```

**Run development server**

```bash
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

## TODO

### Direct Upload
    - Progress bar improvement

### FTP Upload
    - Show FTP server list of files and directories
    - Selection button on which file or directory to upload
    - Message about check "Sessions" tab
    - Backend endpoint to handle FTP list of files and directories
    - Backend endpoint to handle FTP upload

### Link Based Upload
    - Backend Endpoint to handle link based upload
    - Session logic for link based upload
    - Message about check "Sessions" tab
