
import os

CONF_PATH = "/etc/nginx/sites-enabled/revers_proxy.conf"

ADMIN_BLOCK = """
    location /admin {
        proxy_pass http://127.0.0.1:8006;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection $connection_upgrade;
    }
"""

def patch_nginx():
    if not os.path.exists(CONF_PATH):
        print(f"File not found: {CONF_PATH}")
        return

    with open(CONF_PATH, "r") as f:
        content = f.read()

    # Check if already patched
    if "location /admin" in content and "proxy_pass http://127.0.0.1:8006" in content:
        print("Nginx already patched.")
        return

    # Find xiaoxiao.cool server block
    marker = "server_name xiaoxiao.cool;"
    idx = content.find(marker)
    if idx == -1:
        print("server_name xiaoxiao.cool not found.")
        return

    # Find the location / { after marker
    loc_marker = "location / {"
    loc_idx = content.find(loc_marker, idx)
    
    if loc_idx == -1:
        print("location / { not found in xiaoxiao.cool block.")
        return

    # Insert before location / {
    new_content = content[:loc_idx] + ADMIN_BLOCK + "\n    " + content[loc_idx:]
    
    with open(CONF_PATH, "w") as f:
        f.write(new_content)
    
    print("Nginx configuration patched successfully.")
    
    # Reload nginx
    os.system("nginx -s reload")
    print("Nginx reloaded.")

if __name__ == "__main__":
    patch_nginx()
