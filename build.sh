#!/usr/bin/env bash
set -o errexit

pip install -r requirements.txt

export NVM_DIR="$HOME/.nvm"
if [ ! -s "$NVM_DIR/nvm.sh" ]; then
  curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.1/install.sh | bash
fi
# shellcheck disable=SC1091
. "$NVM_DIR/nvm.sh"
nvm install 20
nvm use 20

cd frontend
npm ci
npm run build
cd ..

python manage.py migrate --noinput
python manage.py seed_data
