rm -rf /tmp/grepl-test && mkdir -p /tmp/grepl-test && cd /tmp/grepl-test
git clone git@github.com:AnthonyRuffino/grepl.git
cd grepl
npm pack
cd ..
npm init -y
npm i /grepl/grepl-0.1.0.tgz
