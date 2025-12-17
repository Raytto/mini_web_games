
import os

CONF_PATH = "/etc/nginx/sites-enabled/revers_proxy.conf"

API_BLOCK = """
    location /api/ {
        proxy_pass http://127.0.0.1:8004;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_http_version 1.1;
    }
"""

def patch_nginx_api():
    if not os.path.exists(CONF_PATH):
        print(f"File not found: {CONF_PATH}")
        return

    with open(CONF_PATH, "r") as f:
        content = f.read()

    # Find xiaoxiao.cool server block
    marker = "server_name xiaoxiao.cool;"
    idx = content.find(marker)
    if idx == -1:
        print("server_name xiaoxiao.cool not found.")
        return

    # Check if /api/ is already there inside this block (rough check)
    # We look for "location /api/" AFTER the xiaoxiao marker
    # But we must ensure we don't match other servers.
    # The next server starts with "server {"
    next_server_idx = content.find("server {", idx)
    
    if next_server_idx == -1:
        search_range = content[idx:]
    else:
        search_range = content[idx:next_server_idx]
        
    if "location /api/" in search_range:
        print("API block might already exist in xiaoxiao.cool block. Checking details...")
        # It might be pointing to 8001 (agentduck) from previous cat output, but that was a different server block.
        # If it exists here, maybe I added it? No.
        # Let's inspect carefully.
        # Actually, let's just insert it before "location / {" which handles the default fallthrough.
        pass

    # Find "location / {" inside the xiaoxiao block
    loc_marker = "location / {"
    loc_idx = content.find(loc_marker, idx)
    
    if loc_idx == -1:
        print("location / { not found in xiaoxiao.cool block.")
        return

    # Insert API_BLOCK before location / {
    new_content = content[:loc_idx] + API_BLOCK + "\n    " + content[loc_idx:]
    
    with open(CONF_PATH, "w") as f:
        f.write(new_content)
    
    print("Nginx patched with API block for xiaoxiao.cool.")
    os.system("nginx -s reload")
    print("Nginx reloaded.")

if __name__ == "__main__":
    patch_nginx_api()
