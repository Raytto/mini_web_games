
import os
import re

CONF_PATH = "/etc/nginx/sites-enabled/revers_proxy.conf"

OLD_BLOCK_START = "location /admin {"
NEW_BLOCK = """
    location = /admin {
        return 301 /admin/;
    }

    location /admin/ {
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

def fix_nginx():
    if not os.path.exists(CONF_PATH):
        print(f"File not found: {CONF_PATH}")
        return

    with open(CONF_PATH, "r") as f:
        content = f.read()

    # regex to match the previous block we added
    # explicit matching or approximate
    # It started with 'location /admin {' and ended with '}'
    # But regex for nested braces is hard.
    
    # Since we know the indent and content from previous step:
    # It was:
    #     location /admin {
    #         proxy_pass http://127.0.0.1:8006;
    #         ...
    #     }
    
    # We can try to replace the exact string if we can reconstruct it, 
    # but exact whitespace might differ.
    
    # Alternative: Remove the old block if exists using string find/replace with known unique substring.
    
    if "location = /admin {" in content:
        print("Redirect block already present.")
        return

    # Look for the start
    start_idx = content.find("location /admin {")
    if start_idx == -1:
        print("Old admin block not found.")
        return
        
    # Find the matching closing brace. 
    # Since we blindly added it last time, let's assume valid nesting or just look for the next "location" or matching indent?
    # Actually, simpler approach:
    # The block we added ends before the next location or end of server block.
    # But easier: I know exactly what I added in patch_nginx.py.
    
    OLD_CONTENT_MATCH = """    location /admin {
        proxy_pass http://127.0.0.1:8006;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection $connection_upgrade;
    }"""
    
    # Try exact replace
    if OLD_CONTENT_MATCH in content:
        new_content = content.replace(OLD_CONTENT_MATCH, NEW_BLOCK.strip('\n'), 1)
        with open(CONF_PATH, "w") as f:
            f.write(new_content)
        print("Replaced old admin block with new block (redirect support).")
        os.system("nginx -s reload")
        print("Nginx reloaded.")
    else:
        print("Could not match exact old content. Attempting fuzzy replace.")
        # Fallback: Replace 'location /admin {' with 'location /admin/ {' AND add the redirect rule before it?
        # Maybe just search for 'location /admin {' and replace just that line with 'location /admin/ {' 
        # BUT we also need the redirect.
        
        # Let's try replacing just the signature line
        updated_content = content.replace("location /admin {", "location /admin/ {")
        
        if updated_content != content:
            # Now insert the redirect block before it
            # Find the new location /admin/ {
            idx = updated_content.find("location /admin/ {")
            insert_redirect = "location = /admin { return 301 /admin/; }\n    "
            
            final_content = updated_content[:idx] + insert_redirect + updated_content[idx:]
            
            with open(CONF_PATH, "w") as f:
                f.write(final_content)
            print("Patched via fuzzy method.")
            os.system("nginx -s reload")
            print("Nginx reloaded.")
        else:
             print("Failed to patch.")

if __name__ == "__main__":
    fix_nginx()
