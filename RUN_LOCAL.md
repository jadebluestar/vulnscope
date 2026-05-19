# VulnScope Kali Run Guide (Full Frontend + Backend + Scanner Tools)

This is the recommended setup for running VulnScope inside VirtualBox or natively on Kali Linux.

## 1) VirtualBox Shared Folder & Permissions Configuration

If you are developing your project inside a Windows host and passing it to a Kali Virtual Machine, follow this setup to grant appropriate directory permissions.

### A. Dynamic Folder Mounting via VirtualBox UI

1. In the running Kali window, select **Devices → Shared Folders → Shared Folders Settings...**
2. Click the **Green Folder Add Icon** (+) on the right.
3. Choose your unzipped local Windows project workspace directory `VulnScope_2` under **Folder Path**.
4. Check **Auto-mount** and check **Make Permanent**.
5. Leave **"Read-only"** unchecked.

### B. Access Authorization

VirtualBox mounts directory arrays under `/media/sf_` configurations. To avoid Permission Denied faults, run this within your terminal:

```bash
sudo usermod -aG vboxsf $USER
```

**Note:** If permissions don't apply immediately, run `sudo reboot` to sync user sessions.

## 2) Install System Prerequisites (Kali Repositories)

Synchronize the system repositories cleanly before downloading core system requirements to prevent 404 Not Found connection problems.

```bash
sudo apt update
sudo apt install -y python3 python3-venv python3-pip nmap nikto sqlmap nodejs npm git curl lsof
```

## 3) Backend Setup (Terminal A)

### A. Handle Symlink VirtualBox Limitations

VirtualBox shared folder architectures (vboxsf) block Python symbolic framework allocation (venv). Create and invoke your virtual execution workspace locally within the home directory instead:

```bash
# Initialize isolated python space locally
python3 -m venv ~/vulnscope_venv
source ~/vulnscope_venv/bin/activate

# Navigate into your shared code directory workspace
cd /media/sf_VulnScope_2/vulnscope

# Complete requirements installation
python3 -m pip install --upgrade pip
pip install -r requirements.txt
```

### B. OpenAI / OpenRouter Key Setup

Sign up for a free developer token profile on [openrouter.ai](https://openrouter.ai) and copy your unique string key identifier:

```bash
export OPENROUTER_KEY="sk-or-v1-your-key-here"
```

### C. Launch Backend Process

```bash
python3 app.py
```

**Backend Port Connection:** `http://127.0.0.1:5000`

## 4) Frontend Setup (Terminal B)

### A. Resolve Shared Folder Watch Bottlenecks

Next.js fast-refresh file observers run extremely slow over VirtualBox shared drives, causing compilation to freeze. Copy your frontend files to local Kali memory space:

```bash
cp -r /media/sf_VulnScope_2/vulnscope/frontend ~/Desktop/vulnscope_frontend
cd ~/Desktop/vulnscope_frontend
```

### B. Clear Windows Artifact Cache & Recompile for Linux

To prevent cross-compilation module crashes caused by Windows node_modules code fragments, clear out old files and reinstall native Linux libraries:

```bash
rm -rf node_modules package-lock.json .next
npm install --platform=linux --arch=x64
```

### C. Set API Environment Variables

Point your local interface endpoint handler cleanly to the local python port address:

```bash
echo "NEXT_PUBLIC_API_BASE_URL=http://127.0.0.1:5000" > .env.local
```

### D. Start Local Web Server

```bash
npm run dev
```

## 5) Verify Scanner Tooling Compatibility

Ensure Kali's core assessment tool binaries are responsive on system path calls:

```bash
nmap --version
nikto -Version
sqlmap --version
```

## 6) Core Runtime Testing Workflow

1. Open Firefox inside Kali Linux and browse to: `http://localhost:3000`
   - *Avoid using `127.0.0.1:3000` directly as the URL bar destination to prevent CORS blocking issues on layout resources.*

2. Register a new user profile and log into your dashboard window.

3. Head to **Targets → Add New Target** → Input local address space: `http://127.0.0.1` (labeled as environment profile: Lab).

4. Jump onto **Scans**, configure tool pipelines (NMAP, NIKTO, etc.) and click **Start Scan**.

5. Check backend terminal streams to verify your automated subprocess structures are spawning tool parameters silently as back-end processes.

6. Head to **Reports / Artifact Vault**, locate the scan line, and click **Download PDF** to grab the compiled report document directly through your user interface.

## 7) Technical Troubleshooting Options

### Port Allocation Conflicts

If port 3000 or 5000 lists as occupied, hunt down and terminate matching active daemon tasks:

```bash
lsof -i :3000
lsof -i :5000
killall -9 node
```

### Mirror Local Changes Back to Windows Workspace Directory

If you implement local text changes or fixes within your Kali desktop development workspace (`~/Desktop/vulnscope_frontend`), synchronize the updated scripts back to your host tracking space for safe Git tracking using:

```bash
rsync -av --exclude=.next --exclude=node_modules ~/Desktop/vulnscope_frontend/ /media/sf_VulnScope_2/vulnscope/frontend/
```

---

**Note:** Keep both Terminal A (backend) and Terminal B (frontend) running simultaneously in separate terminal windows for full functionality.
```
