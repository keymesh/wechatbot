KeyMesh wechat bot
==========================

## Requirements

NodeJS 8 and yarn

```shell
sudo apt-get update -y && \
sudo apt-get install -y make apt-transport-https ; \
curl -sL https://deb.nodesource.com/setup_8.x | sudo -E bash - ; \
curl -sS https://dl.yarnpkg.com/debian/pubkey.gpg | sudo apt-key add - ; \
echo "deb https://dl.yarnpkg.com/debian/ stable main" | sudo tee /etc/apt/sources.list.d/yarn.list ; \
sudo apt-get update -y  ; \
sudo apt-get install -y nodejs yarn
```


```shell
sudo apt-get -y install libpangocairo-1.0-0 libx11-xcb1 libxcomposite1 libxcursor1 libxdamage1 libxi6 libxtst6 libnss3 libcups2 libxss1 libxrandr2 libgconf2-4 libasound2 libatk1.0-0 libgtk-3-0 supervisor
```

## Installation

clone respo

```shell
git clone git@github.com:keymesh/wechatbot.git
```
make a temp directory

```shell
mkdir -p /home/ubuntu/wechatbot/temp
```

config supervisor

```shell
# CHANGE ENVIRONMENTS
vim _etc_supervisor_conf.d_wechatbot.conf

sudo cp /home/ubuntu/wechatbot/_etc_supervisor_conf.d_wechatbot.conf /etc/supervisor/conf.d/wechatbot.conf

sudo supervisorctl
supervisor> reload
```
