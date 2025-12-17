#!/bin/bash
screen -dmS mini_web_games_admin bash -c 'cd /root/dev/mini_web_games/frontend-admin && npm run dev'
echo "Admin Frontend started in screen session 'mini_web_games_admin'"
