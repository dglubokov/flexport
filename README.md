# flexport
Flexport is Distributed Web-Based File Manager

## Deployment

First of all you should put this repo to the root accessable directory of your server.

You also should run this app from root, because of PAM authentication.

### Frontend

TODO

### Backend

TODO


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
uvicorn main:app --host 0.0.0.0 --port 8009 --reload
```


## TODO

- Structurize code
- Add tests
- Add deployment instructions and scripts
- Fix some bad CSS
- Handle folder management
