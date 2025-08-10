git clone git@github.com:AnthonyRuffino/grepl.git
cd grepl
npm pack
npm init -y
npm i grepl-0.0.1.tgz
node -e "import('grepl').then(m => m.install())"
