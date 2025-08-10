#!/bin/bash

# Usage: ./install.sh [install_method] [version]
# install_method: "wget" (direct download) or "npm" (clone + npm pack)
# version: optional tag version for npm mode (e.g., "0.0.1", "v1.0.0") - defaults to "main"

INSTALL_METHOD=${1:-"wget"}
VERSION=${2:-}

echo "Installing grepl with method: $INSTALL_METHOD, version: $VERSION"

if [ "$INSTALL_METHOD" = "wget" ]; then
    echo "Installing via wget from GitHub"
    
    # Create target directory
    mkdir -p ~/.local/bin
    
    # Check if target file exists and prompt user
    if [ -f ~/.local/bin/grepl ]; then
        read -p "File ~/.local/bin/grepl already exists. Overwrite? [y/N]: "
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            echo "Installation cancelled."
            exit 0
        fi
    fi
    
    # Download based on version parameter
    if [ -n "$VERSION" ]; then
        echo "Downloading version: $VERSION"
        wget -O grepl "https://raw.githubusercontent.com/AnthonyRuffino/grepl/refs/tags/$VERSION/grepl.sh"
    else
        wget -O grepl "https://raw.githubusercontent.com/AnthonyRuffino/grepl/refs/heads/main/grepl.sh"
    fi
    
    chmod +x grepl
    mv grepl ~/.local/bin/grepl
    echo "✅ grepl installed to ~/.local/bin/grepl"
    
elif [ "$INSTALL_METHOD" = "npm" ]; then
    echo "Installing via npm pack (clone + build)"
    
    # Create temp directory for build
    rm -rf /tmp/grepl-install && mkdir -p /tmp/grepl-install && cd /tmp/grepl-install
    
    # Clone and checkout version if specified
    git clone -q git@github.com:AnthonyRuffino/grepl.git
    cd grepl/
    
    if [ -n "$VERSION" ]; then
        echo "Checking out version: $VERSION"
        git checkout -q "$VERSION"
    fi
    
    if [ -n "$VERSION" ]; then
        # Use provided version parameter
        PACKAGE_VERSION="$VERSION"
    else
        # Extract version from package.json using grepl.sh
        VERSION_LINE=$(grep --color=never '"version": "' package.json)
        PACKAGE_VERSION=$(echo "$VERSION_LINE" | sed 's/.*"version": "\([^"]*\)".*/\1/')
        echo "Checking out version from main package.json: ${PACKAGE_VERSION}"
        git checkout -q "${PACKAGE_VERSION}"
    fi

    # Build and install
    npm pack --silent

    echo "Installing grepl npm package: grepl-${PACKAGE_VERSION}.tgz"
    npm i --silent "grepl-${PACKAGE_VERSION}.tgz"

    echo "Installing grepl via npm install()"
    node -e "import('grepl').then(m => m.install())"
    
    # Cleanup
    rm -rf /tmp/grepl-install
    echo "✅ npm installation completed"
    
else
    echo "Error: Invalid install method '$INSTALL_METHOD'. Use 'wget' or 'npm'."
    exit 1
fi

echo "Installation completed successfully!"
