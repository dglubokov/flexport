import socket

hostname = socket.gethostname()
api_js_file = "./frontend/src/services/api.js"

with open(api_js_file, "r") as file:
    content = file.read()
updated_content = content.replace("lifespan", hostname)

with open(api_js_file, "w") as file:
    file.write(updated_content)

print(f"Updated hostname to {hostname}")
