#!/bin/bash

# Usage: ./test.sh [version] [install_method]
# version: optional tag version (e.g., "0.0.1", "v1.0.0")
# install_method: "npm" (default) or "wget"

VERSION=${1:-"main"}
INSTALL_METHOD=${2:-"npm"}

echo "Testing grepl with version: $VERSION, install method: $INSTALL_METHOD"

rm -rf /tmp/grepl-test && mkdir -p /tmp/grepl-test && cd /tmp/grepl-test

if [ "$VERSION" = "main" ]; then
    echo "Using main branch"
    git clone git@github.com:AnthonyRuffino/grepl.git
    cd grepl/
else
    echo "Using tag: $VERSION"
    git clone git@github.com:AnthonyRuffino/grepl.git
    cd grepl/
    git checkout "$VERSION"
fi

if [ "$INSTALL_METHOD" = "wget" ]; then
    echo "Installing via wget from GitHub"
    if [ "$VERSION" = "main" ]; then
        wget -O grepl.sh "https://raw.githubusercontent.com/AnthonyRuffino/grepl/refs/heads/main/grepl.sh"
    else
        wget -O grepl.sh "https://raw.githubusercontent.com/AnthonyRuffino/grepl/refs/tags/$VERSION/grepl.sh"
    fi
    chmod +x grepl.sh
    echo "✅ grepl.sh downloaded and made executable"
else
    echo "Installing via npm pack"
    npm pack
    npm init -y
    npm i "grepl-$(npm pack --dry-run | grep -o 'grepl-[0-9.]*\.tgz' | head -1 | sed 's/\.tgz$//').tgz"
    node -e "import('grepl').then(m => m.install())"
fi

echo "Test completed for version: $VERSION, method: $INSTALL_METHOD"
rm -rf /tmp/grepl-test
