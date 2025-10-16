1. 
```bash
cd SashaGallery/apps/admin-backend
poetry init -n
```
2. Add dependences:
```bash
poetry add fastapi uvicorn[standard] python-multipart pydantic-settings
poetry env use python3.12
```
3. Activate virtual environment:
```bash
poetry env activate
```
4. Create project structure:
```bash
mkdir -p app/routers storage/json storage/uploads
touch app/__init__.py app/main.py app/settings.py app/deps.py app/storage.py \
app/routers/__init__.py app/routers/health.py app/routers/json_kv.py app/routers/upload.py
```
5. Create .env:
```bash
cat > .env << 'EOF'
ADMIN_ORIGIN=http://localhost:5173
SITE_ORIGIN=http://localhost:5174
STORAGE_DIR=./storage
ADMIN_TOKEN=change-me
EOF
```
6. Run server:
```bash
uvicorn app.main:app --reload
```
7. In VS Code select python the same as shown in
```bash
poetry env info
```
8. Init GIT