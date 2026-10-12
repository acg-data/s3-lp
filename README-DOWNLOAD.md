# Studio Three — complete source code

Includes the full source, original photos, shared libraries, dependency lockfile,
and project configuration. Secrets, Git history, and installed dependencies are excluded.

## Copy to GitHub
Unzip the archive and upload the CONTENTS of the studio-three-codebase folder to
your repository, preserving the folder structure and hidden files.

## Run locally
Install Node.js 24 and pnpm. In a terminal opened in this folder:

    pnpm install

macOS / Linux:

    PORT=5173 BASE_PATH=/ pnpm --filter @workspace/studio-three run dev

Windows PowerShell:

    $env:PORT="5173"
    $env:BASE_PATH="/"
    pnpm --filter @workspace/studio-three run dev

Then open http://localhost:5173.

## Production build
With PORT and BASE_PATH set as above, run:

    pnpm --filter @workspace/studio-three run build

macOS / Linux can use:

    PORT=5173 BASE_PATH=/ pnpm --filter @workspace/studio-three run build

Built files are in artifacts/studio-three/dist/public.

## Project folders
- artifacts/studio-three: website
- attached_assets: original photos used by the website
- lib: shared libraries
- artifacts/api-server: API scaffold (not needed to run this landing page)
- artifacts/mockup-sandbox: design preview scaffold

No backend credentials are included. Configure them separately if extending the backend.
