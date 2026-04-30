# Yunzai-Github-Event
![F756619176FDC707BBBB9B233DCAC896](https://user-images.githubusercontent.com/21212372/228231656-4e6c65d1-7e63-4037-a30f-9cf8e9fe46da.gif)

github event plugin for Yunzai

使yunzai机器人能够接收到**自己**仓库的更新。基于github的webhook

参考config目录下的config.example.yaml和repos.example.yaml，将config.example.yaml重命名为config.yaml，将repos.example.yaml重命名为repos.yaml，然后在repos.yaml中添加自己仓库的id和token，token是github仓库的settings->webhooks->add webhook->secret

```
git clone https://github.com/ikechan8370/Yunzai-Github-Event.git .\plugins\github
```

然后添加一个webhook，大概是`http://[ip]:[端口号默认59009]/github-webhook`

<img width="1148" alt="image" src="https://user-images.githubusercontent.com/21212372/228236286-24384e83-aded-4fcc-ba61-1e1eb241aaa1.png">


根据情况选是所有事件还是只有push

别的自己看吧！
