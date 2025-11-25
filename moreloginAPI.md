浏览器环境
本周更新
1、启动浏览器环境
基本信息
POST  /api/env/start

接口描述: 用于启动环境，需要指定环境ID，启动成功后可以获取环境debug接口用于执行selenium和puppeteer自动化。 Selenium需要使用到对应内核版本匹配的Webdriver。启动环境后可在返回值中拿到对应的Webdriver的路径。需将MoreLogin应用更新至2.15.0及以上版本。

注：使用此接口需启动MoreLogin客户端并成功登录。

 

请求参数
Body 参数， 非必传参数可以不传递，传参格式为JSON

参数名称

类型

必传

说明

envId

string

否

环境 ID

环境ID或者环境序号至少传一个；两者都传以环境ID为主

isHeadless

boolean

否

是否以 headless 方式启动浏览器环境。

注：需升级到 V2.36.0 及以上版本

uniqueId

integer(int32)

否

环境序号

环境ID或者环境序号至少传一个；两者都传以环境ID为主

encryptKey

string

否

密钥，环境开启端对端加密时必传

cdpEvasion

boolean

否

是否启用CDP特征规避机制，启用后可减少被检测的风险。

默认: false

注：需升级到 V2.36.0 及以上版本

 
请求示例
{
    "envId": "1795695767353204736",
    "encryptKey": "xxx"
}
返回数据
{
    "code": 0, // 返回结果编码 0:正常 其他编码都是异常
    "msg": "", // 错误信息
    "data": {
             "envId": "1795695767353204736", // 环境 ID
              "debugPort": "61598", // debug port
     "webdriver": "xxx" // path of webdriver.exe
}
}
2、关闭浏览器环境
基本信息
POST  /api/env/close

接口描述: 关闭指定环境，需要指定环境ID。需将MoreLogin应用更新至2.15.0及以上版本。

注：使用此接口需启动MoreLogin客户端并成功登录。

 

请求参数
Body 参数， 非必传参数可以不传递，传参格式为JSON

参数名称

类型

必传

说明

envId

string

否

环境 ID

环境ID或者环境序号至少传一个；两者都传以环境ID为主

uniqueId

integer(int32)

否

环境序号

环境ID或者环境序号至少传一个；两者都传以环境ID为主

 
请求示例
{
    "envId": "1795695767353204736"
}
返回数据
{
    "code": 0, // 返回结果编码 0:正常 其他编码都是异常
    "msg": "", // 错误信息
    "data": {
             "envId": "1795695767353204736", // 环境 ID
         }
}
 

3、快速创建浏览器环境
基本信息
POST  /api/env/create/quick

接口描述: 快速创建环境，支持设置环境的浏览器、操作系统、创建环境数量。创建成功后返回环境ID。需将MoreLogin应用更新至2.14.0及以上版本。

注：使用此接口需启动MoreLogin客户端并成功登录。

请求参数
Body 参数， 非必传参数可以不传递，传参格式为JSON

参数名称

类型

必传

说明

browserTypeId

integer(int32)

是

浏览器类型 

1：Chrome，2： Firefox

operatorSystemId

integer(int32)

是

操作系统类型

1：Windows，2：macOS，3：Android，4：IOS

quantity

integer(int32)

是

创建环境数，数值范围：[1-50]

browserCore

integer(int32)

否

内核版本号，默认：0-智能匹配

可通过“获取浏览器内核版本”接口获取可用的内核版本

groupId

integer(int64)

否

环境分组ID，默认：未分组-0

注：分组授权模式下，若您无“全部环境”权限，此字段则需要必填

 isEncrypt

integer(int32)

否

是否开启「端对端加密」

 0：关闭，1：开启，默认0

 
请求示例
{
    "browserTypeId": 0,
    "groupId": 0,
    "isEncrypt": 0,
    "operatorSystemId": 0,
    "quantity": 0
}
返回数据
{
    "code": 0, // 返回结果编码 0:正常 其他编码都是异常
    "msg": "", // 错误信息
    "data": [1,2,3], // 环境ID数组
    "requestId": "", // 操作请求ID
}
4、高级创建浏览器环境
基本信息
POST /api/env/create/advanced

接口描述: 高级创建环境，支持设置环境的平台账号密码、cookie、指纹信息等等。创建成功后返回环境ID。需将MoreLogin应用更新至2.14.0及以上版本。

 

注：使用此接口需启动MoreLogin客户端并成功登录。

 

请求参数
Body 参数， 非必传参数可以不传递，传参格式为JSON

参数名称

类型

必传

说明

browserTypeId

integer(int32)

是

浏览器类型 

1：Chrome，2： Firefox

operatorSystemId

integer(int32)

是

操作系统类型

1：Windows，2：macOS，3：Android，4：IOS

envName

string

否

环境名称，长度限制100字符

accountInfo

 

否

环境账号信息

advancedSetting

object

否

高级配置

afterStartupConfig

 

否

环境启动后相关配置

browserCore

integer(int32)

否

内核版本号，默认：0-智能匹配

可通过“获取浏览器内核版本”接口获取可用的内核版本

cookies

string

否

Cookie

envRemark

string

否

环境备注，长度限制1500字符

groupId

integer(int64)

否

环境分组ID，默认：未分组-0，限制最小值0

注：分组授权模式下，若您无“全部环境”权限，此字段则需要必填

isEncrypt

integer(int32)

否

是否开启「端对端加密」

 0：关闭，1：开启，默认0

proxyId

integer(int64)

否

代理ID，默认：0，限制最小值0

tagIds

array

否

标签ID，默认：无

uaVersion

integer(int32)

否

UA，默认：0-全部

可通过“获取浏览器内核版本列表”接口获取可用的UA版本

startupParams

array

否

环境启动参数，具体详见文档

disableAudio

integer(int32)

否

禁止播放音频：默认0

0关闭，1开启

disableVideo

integer(int32)

否

禁止加载视频：默认0

0关闭，1开启

disableImg

integer(int32)

否

禁止加载图片：默认0

0关闭，1开启

imgLimitSize

integer(int32)

否

图片限制大小；默认10kb

 
accountInfo

参数名称

类型

必传

说明

platformId

integer(int64)

是

平台ID

9999-自定义平台，可通过“获取可配置平台”接口获取其余平台ID

customerUrl

string

否

自定义平台URL，当平台ID=9999时必填，必须是合法的url地址

username

string

否

用户名，长度限制64字符

password

string

否

密码，长度限制50字符

otpSecret

string

否

2FA密钥

适用于网站的二次验证码生成，类似Google身份验证器。

siteId

integer(int64)

否

站点ID

可通过“获取可配置平台”接口获取

 
 

advancedSetting

参数名称

类型

必传

说明

ua

string

否

自定义环境UA，格式需按照标准格式上传

可通过“获取浏览器环境UA”接口获取

time_zone

object {2}

否

时区

web_rtc

object {1}

否

WebRTC

geo_location

object {5}

否

地理位置

language

object {2}

否

语言

resolution

object {2}

否

分辨率

font

object {2}

否

字体

canvas

object {1}

否

Canvas

webgl_image

object {1}

否

WebGL图像

webgl_metadata

object {1}

否

WebGL元数据

audio_context

object {1}

否

AudioContext

media_device

object {1}

否

媒体设备

client_rects

object {1}

否

ClientRects

speech_voise

object {1}

否

SpeechVoices

hardware_concurrency

int

否

硬件并发数，默认：4

0（真实并发数），2，3，4，6，8，10，12

memery_device

int

否

设备内存，默认：8

0（真实内存），2，4，6，8

do_not_track

int

否

Do Not Track，默认：2

1：开启，2：关闭

bluetooth

object {1}

否

蓝牙

battery

object {1}

否

电池

port_scan_protectio

object {2}

否

端口扫描保护

os_version

string

否

macOS系统版本

例如：macOS 12, macOS 13, macOS 14 

web_gpu

object {1}

否

WebGPU

ciphers

object {1}

否

禁用 TLS 协议

mobile_device

int

否

手机机型ID，可通过“获取手机机型列表”接口获取。例如：{"mobile_device": "1826502391344832512"}

 
time_zone

参数名称

类型

必传

说明

switcher

int

否

时区选项，默认1

1：匹配IP，2：自定义

value

string

否

switcher 传 2 时必传，需传对应时区ID

可通过“获取时区语言列表”接口获取

 
web_rtc

参数名称

类型

必传

说明

switcher

int

否

WebRTC选项，默认2

1：隐私，2：替换，3：真实，4：禁用，5：转发

 
geo_location

参数名称

类型

必传

说明

switcher

int

否

地理位置选项，默认：1

1：询问，2：禁用

base_on_ip

bool

否

是否基于IP生成，默认：true

true：询问，false：否

latitude

float

否

纬度，不基于IP生成对应的地理位置时必传

longitude

float

否

经度，不基于IP生成对应的地理位置时必传

accuracy

float

否

精度(米)，不基于IP生成对应的地理位置时必传

 
language

参数名称

类型

必传

说明

switcher

int

否

语言选项，默认：1

1：匹配IP，2：自定义

value

string

否

switcher 传 2 时必传，需传对应语言ID

可通过“获取时区语言列表”接口获取

 
resolution

参数名称

类型

必传

说明

switcher

int

否

分辨率选项，默认：1

1：真实，2：自定义

id

string

否

switcher选择2时必传

可通过“获取分辨率”接口获取

 
font

参数名称

类型

必传

说明

switcher

int

否

字体选项，默认：1

1：真实，2：自定义

value

string

否

switcher选择自定义时必填,逗号分隔需要使用的字体

可用字体详见附件

 
canvas

参数名称

类型

必传

说明

switcher

int

否

Canvas选项，默认：1

1：噪音，2：真实

 
webgl_image

参数名称

类型

必传

说明

switcher

int

否

WebGL图像选项，默认：1

1：噪音，2：真实

 
webgl_metadata

参数名称

类型

必传

说明

switcher

int

否

WebGL元数据选项，默认：3

1： 真实，2：关闭硬件加速，3：自定义

 
audio_context

参数名称

类型

必传

说明

switcher

int

否

AudioContext选项，默认：1

1： 噪音，2：真实

 
media_device

参数名称

类型

必传

说明

switcher

int

否

媒体设备选项，默认：1

1： 噪音，2：真实

 
client_rects

参数名称

类型

必传

说明

switcher

int

否

ClientRects选项，默认：1

1： 噪音，2：真实

 
speech_voise

参数名称

类型

必传

说明

switcher

int

否

SpeechVoices选项，默认：1

1： 隐私，2：真实

 
bluetooth

参数名称

类型

必传

说明

switcher

int

否

蓝牙选项，默认：1

1： 隐私，2：真实

 
battery

参数名称

类型

必传

说明

switcher

int

否

电池选项，默认：1

1： 隐私，2：真实

 
port_scan_protection

参数名称

类型

必传

说明

switcher

int

否

端口扫描保护选项，默认：1

1： 开启，2：关闭

value

string

否

允许被连接的本地网络端口

 
web_gpu

参数名称

类型

必传

说明

switcher

int

否

WebGPU选项，默认：1

1： 基于WebGL匹配，2：真实，3：禁用

 
afterStartupConfig

参数名称

类型

必传

说明

afterStartup

integer(int32)

否

启动后设置，默认：1

1：继续浏览上次打开的网页，2：打开指定的网页，3：打开指定的网页和平台，4：继续浏览上次打开的网页和平台

autoOpenUrls

array

否

打开指定的网页地址，必须是有效的url地址

 
ciphers

参数名称

类型

必传

说明

switcher

int

否

禁用 TLS 协议选项，默认：1                                       

 1： 默认，2：自定义

value

string

否

switcher 传 2 时必传，需传对应需禁用 TLS 协议 ，具体详见：禁用 TLS 协议与value值对应关系

 
 

请求示例
{
    "accountInfo": {
        "customerUrl": "",
        "password": "",
        "platformId": 0,
        "siteId": 0,
        "username": ""
    },
    "advancedSetting": {

    },
    "afterStartupConfig": {
        "afterStartup": 0,
        "autoOpenUrls": [

        ]
    },
    "browserCore": 0,
    "browserTypeId": 0,
    "cookies": "",
    "envName": "",
    "envRemark": "",
    "groupId": 0,
    "isEncrypt": 0,
    "operatorSystemId": 0,
    "proxyId": 0,
    "tagIds": [

    ],
    "uaVersion": 0,
    "disableAudio": 0,
    "disableVideo": 0,
    "disableImg": 0,
    "imgLimitSize": 10
}
返回数据
{
    "code": 0, // 返回结果编码 0:正常 其他编码都是异常
    "msg": "", // 错误信息
    "data": 0, // 环境ID
    "requestId": "", // 操作请求ID
}
5、修改浏览器环境
基本信息
POST  /api/env/update

接口描述: 修改环境参数，包括环境名称、代理信息、指纹信息等。创建成功后返回环境ID。需将MoreLogin应用更新至2.14.0及以上版本。

 

注：使用此接口需启动MoreLogin客户端并成功登录。

 

请求参数
Body 参数， 非必传参数可以不传递，传参格式为JSON

参数名称

类型

必传

说明

envId

integer(int64)

是

环境ID

envName

string

否

环境名称，长度限制100字符

accountInfo

 

否

环境账号信息

advancedSetting

object

否

高级设置

afterStartupConfig

 

否

环境启动后相关配置

browserCore

integer(int32)

否

内核版本号，默认：0-智能匹配

可通过“获取浏览器内核版本”接口获取可用的内核版本

cookies

string

否

Cookie

envRemark

string

否

环境备注，长度限制1500字符

groupId

integer(int64)

否

环境分组ID，默认：未分组-0，限制最小值0

注：分组授权模式下，若您无“全部环境”权限，此字段则需要必填

isEncrypt

integer(int32)

否

是否开启「端对端加密」

 0：关闭，1：开启，默认0

proxyId

integer(int64)

否

代理ID，默认：0，限制最小值0

tagIds

array

否

标签ID，默认：无

uaVersion

integer(int32)

否

UA，默认：0-全部

可通过“获取浏览器内核版本列表”接口获取可用的UA版本

startupParams

array

否

环境启动参数，具体详见文档

disableAudio

integer(int32)

否

禁止播放音频：默认0

0关闭，1开启

disableVideo

integer(int32)

否

禁止加载视频：默认0

0关闭，1开启

disableImg

integer(int32)

否

禁止加载图片：默认0

0关闭，1开启

imgLimitSize

integer(int32)

否

图片限制大小；默认10kb

ciphers

object {1}

否

禁用 TLS 协议

 
 

accountInfo

参数名称

类型

必传

说明

platformId

integer(int64)

是

平台ID

9999-自定义平台，可通过“获取可配置平台”接口获取其余平台ID

customerUrl

string

否

自定义平台URL，当平台ID=9999时必填，必须是合法的url地址

username

string

否

用户名，长度限制64字符

password

string

否

密码，长度限制50字符

siteId

integer(int64)

否

站点ID

可通过“获取可配置平台”接口获取

otpSecret

string

否

2FA密钥

 
 

advancedSetting

参数名称

类型

必传

说明

ua

string

否

自定义环境UA，格式需按照标准格式上传

可通过“获取浏览器环境UA”接口获取

time_zone

object {2}

否

时区

web_rtc

object {1}

否

WebRTC

geo_location

object {5}

否

地理位置

language

object {2}

否

语言

resolution

object {2}

否

分辨率

font

object {2}

否

字体

canvas

object {1}

否

Canvas

webgl_image

object {1}

否

WebGL图像

webgl_metadata

object {1}

否

WebGL元数据

audio_context

object {1}

否

AudioContext

media_device

object {1}

否

媒体设备

client_rects

object {1}

否

ClientRects

speech_voise

object {1}

否

SpeechVoices

hardware_concurrency

int

否

硬件并发数，默认：4

0（真实并发数），2，3，4，6，8，10，12

memery_device

int

否

设备内存，默认：8

0（真实内存），2，4，6，8

do_not_track

int

否

Do Not Track，默认：2

1：开启，2：关闭

bluetooth

object {1}

否

蓝牙

battery

object {1}

否

电池

port_scan_protectio

object {2}

否

端口扫描保护

os_version

string

否

macOS系统版本

例如：macOS 12, macOS 13, macOS 14 

web_gpu

object {1}

否

WebGPU

 
time_zone

参数名称

类型

必传

说明

switcher

int

否

时区选项，默认1

1：匹配IP，2：自定义

value

string

否

switcher 传 2 时必传，需传对应时区ID

可通过“获取时区语言列表”接口获取

 
web_rtc

参数名称

类型

必传

说明

switcher

int

否

WebRTC选项，默认2

1：隐私，2：替换，3：真实，4：禁用，5：转发

 
geo_location

参数名称

类型

必传

说明

switcher

int

否

地理位置选项，默认：1

1：询问，2：禁用

base_on_ip

bool

否

是否基于IP生成，默认：true

true：询问，false：否

latitude

float

否

纬度，不基于IP生成对应的地理位置时必传

longitude

float

否

经度，不基于IP生成对应的地理位置时必传

accuracy

float

否

精度(米)，不基于IP生成对应的地理位置时必传

 
language

参数名称

类型

必传

说明

switcher

int

否

语言选项，默认：1

1：匹配IP，2：自定义

value

string

否

switcher 传 2 时必传，需传对应语言ID

可通过“获取时区语言列表”接口获取

 
resolution

参数名称

类型

必传

说明

switcher

int

否

分辨率选项，默认：1

1：真实，2：自定义

id

string

否

switcher选择2时必传

可通过“获取分辨率”接口获取

 
font

参数名称

类型

必传

说明

switcher

int

否

字体选项，默认：1

1：真实，2：自定义

value

string

否

switcher选择自定义时必填,逗号分隔需要使用的字体

可用字体详见附件

 
canvas

参数名称

类型

必传

说明

switcher

int

否

Canvas选项，默认：1

1：噪音，2：真实

 
webgl_image

参数名称

类型

必传

说明

switcher

int

否

WebGL图像选项，默认：1

1：噪音，2：真实

 
webgl_metadata

参数名称

类型

必传

说明

switcher

int

否

WebGL元数据选项，默认：3

1： 真实，2：关闭硬件加速，3：自定义

 
audio_context

参数名称

类型

必传

说明

switcher

int

否

AudioContext选项，默认：1

1： 噪音，2：真实

 
media_device

参数名称

类型

必传

说明

switcher

int

否

媒体设备选项，默认：1

1： 噪音，2：真实

 
client_rects

参数名称

类型

必传

说明

switcher

int

否

ClientRects选项，默认：1

1： 噪音，2：真实

 
speech_voise

参数名称

类型

必传

说明

switcher

int

否

SpeechVoices选项，默认：1

1： 隐私，2：真实

 
bluetooth

参数名称

类型

必传

说明

switcher

int

否

蓝牙选项，默认：1

1： 隐私，2：真实

 
battery

参数名称

类型

必传

说明

switcher

int

否

电池选项，默认：1

1： 隐私，2：真实

 
port_scan_protection

参数名称

类型

必传

说明

switcher

int

否

端口扫描保护选项，默认：1

1： 开启，2：关闭

value

string

否

允许被连接的本地网络端口

 
web_gpu

参数名称

类型

必传

说明

switcher

int

否

WebGPU选项，默认：1

1： 基于WebGL匹配，2：真实，3：禁用

 
afterStartupConfig

参数名称

类型

必传

说明

afterStartup

integer(int32)

否

启动后设置，默认：1

1：继续浏览上次打开的网页，2：打开指定的网页，3：打开指定的网页和平台，4：继续浏览上次打开的网页和平台

autoOpenUrls

array

否

打开指定的网页地址，必须是有效的url地址

 
ciphers

参数名称

类型

必传

说明

switcher

int

否

禁用 TLS 协议选项，默认：1                                       

 1： 默认，2：自定义

value

string

否

switcher 传 2 时必传，需传对应需禁用 TLS 协议 ，具体详见：禁用 TLS 协议与value值对应关系

 
 

请求示例
{
    "accountInfo": {
        "customerUrl": "",
        "password": "",
        "platformId": 0,
        "siteId": 0,
        "username": ""
    },
    "advancedSetting": {

    },
    "afterStartupConfig": {
        "afterStartup": 0,
        "autoOpenUrls": [

        ]
    },
    "browserCore": 0,
    "cookies": "",
    "envName": "",
    "envRemark": "",
    "groupId": 0,
    "envId": 0,
    "proxyId": 0,
    "tagIds": [],
    "uaVersion": 0
    "disableAudio": 0,
    "disableVideo": 0,
    "disableImg": 0,
    "imgLimitSize": 10
}
返回数据
{
    "code": 0, // 返回结果编码 0:正常 其他编码都是异常
    "msg": "", // 错误信息
    "requestId": "", // 操作请求ID
}
6、删除浏览器环境
基本信息
POST  /api/env/removeToRecycleBin/batch

接口描述: 删除不需要的环境，删除后7天内可在「回收站」中找回。需将MoreLogin应用更新至2.14.0及以上版本。

 

注：使用此接口需启动MoreLogin客户端并成功登录。

 

请求参数
Body 参数， 非必传参数可以不传递，传参格式为JSON

参数名称

类型

必传

说明

envIds

array

是

环境ids

removeEnvData

boolean

否

是否同时删除配置文件，支持 2.28.0 及以上版本支持

 
请求示例
{
    "envIds": []
    "removeEnvData": true
}
返回数据
{
    "code": 0, // Return result code 0:Normal Other codes are exceptions.
    "msg": "", // Error message
    "data": true,
    "requestId": "", // Operation request ID
}
7、获取浏览器环境列表
基本信息
POST  /api/env/page

接口描述: 查询已添加的环境信息。用户仅能查询自己有权限的环境信息。需将MoreLogin应用更新至2.14.0及以上版本。

 

请求参数
Body 参数， 非必传参数可以不传递，传参格式为JSON

参数名称

类型

必传

说明

pageNo

integer(int64)

是

当前页，默认1

pageSize

integer(int64)

是

每页条数，默认10

envName

string

否

按环境名称查询

groupId

integer(int64)

否

按分组ID查询，0：未分组

envId

integer(int64)

否

按环境id查询

 
请求示例
{
    "envName": "",
    "groupId": 0,
    "envId": 0,
    "pageNo": 0,
    "pageSize": 0
}
返回数据
{
     "code": 0, // 返回结果编码 0:正常 其他编码都是异常
     "msg": "", // 错误信息
     "data": {
              "current": 0,
              "dataList": [ // 环境列表信息
                      {
                          "envName": "", // 环境名称
                          "groupId": 0, // 分组ID
                          "Id": 0, // 环境ID
                          "proxyId": 0, // 代理ID
                          "proxy": {  
                              "exportIp": "4.10.161.190", //出口IP                                                                                                                         
                              "countryCode": "US"  //IP归属国家简码 
                          }
                      }
            ],
            "pages": 0,
            "total": 0
    },
    "requestId": "", // 操作请求ID
}
8、获取浏览器环境详情
基本信息
POST  /api/env/detail

接口描述: 查询环境详情信息。用户仅能查询自己有权限的环境信息。需将MoreLogin应用更新至2.14.0及以上版本。

 

请求参数
Body 参数， 非必传参数可以不传递，传参格式为JSON

参数名称

类型

必传

说明

envId

integer(int64)

是

要查询的环境ID

 
请求示例
{
   "envId": 0
}
返回数据
{
    "code": 0, // 返回结果编码 0:正常 其他编码都是异常
    "msg": "", // 错误信息
    "data": {
            "accountInfo": { // 账号信息
                    "customerUrl": "", // 自定义平台url
                    "password": "", // 密码
                    "platformId": 0, // 平台ID
                    "siteId": 0, // 站点ID
                    "username": "" // 用户名
           },
           "advancedSetting": {}, // 高级配置参数
           "afterStartupConfig": { // 启动后设置信息
               "afterStartup": 0, // 启动后设置，1：继续浏览上次打开的网页，2：打开指定的网页，3：打开指定的网页和平台，4：继续浏览上次打开的网页和平台
               "autoOpenUrls": [], // 打开指定的网页信息
               "platformUrl": "" // 平台地址
         },
         "browserCore": 0, // 内核版本号
         "browserTypeId": 0, // 浏览器类型，1：Chrome，2： Firefox
         "cookies": "", // Cookie
         "envName": "", // 环境名称
         "envRemark": "", // 环境备注
         "groupId": 0, // 分组ID
         "id": 0, // 环境ID
         "isEncrypt": 0, // 是否「端对端加密」，0：否，1：是
         "operatorSystemId": 0, // 操作系统类型，1：Windows，2：macOS，3：    Android，4：IOS
         "proxyId": 0, // 代理ID
         "tagIds": [], // 标签ID
         "uaVersion": 0 // UA
    }
    "requestId": "", // 操作请求ID
}
9、获取浏览器内核版本列表
基本信息
GET  /api/env/advanced/ua/versions

接口描述: 查询可用的浏览器内核版本。需将MoreLogin应用更新至2.14.0及以上版本。

注：使用此接口需启动MoreLogin客户端并成功登录。

 

返回数据
{
    "code": 0, // 返回结果编码 0:正常 其他编码都是异常
    "msg": "", // 错误信息
    "data": [
            {
                "browserType": 0, // 浏览器类型，1：Chrome，2： Firefox
                "versions": [] // 版本号
            }
    ],
    "requestId": "", // 操作请求ID
}
10、获取浏览器环境UA
基本信息
POST  /api/env/advanced/ua/get

接口描述: 获取可用的浏览器环境UA。需将MoreLogin应用更新至2.14.0及以上版本。

注：使用此接口需启动MoreLogin客户端并成功登录。

 

请求参数
Body 参数， 非必传参数可以不传递，传参格式为JSON

参数名称

类型

必传

说明

os

integer(int32)

否

对应不同的操作系统

1：Windows，2：macOS，3：Android，4：IOS

osVersion

string

否

系统版本

包含：Windows 7-11，macOS 12-14

vendor

integer(int32)

否

对应不同的浏览器类型

1：Chrome，2： Firefox

 
请求示例
{
    "os": 0,
    "osVersion": "",
    "vendor": 0
}
返回数据
{
    "code": 0, // 返回结果编码 0:正常 其他编码都是异常
    "msg": "", // 错误信息
    "data": {
            "resolution": { // 默认分辨率值
                   "id": "", // 分辨率ID
                   "value": "" // 分辨率值
           },
           "ua": "" // UA
    },
    "requestId": "", // 操作请求ID
}
 

11、获取分辨率
基本信息
POST  /api/env/base/resolution/list

接口描述: 根据UA获取可用的分辨率。需将MoreLogin应用更新至2.14.0及以上版本。

注：使用此接口需启动MoreLogin客户端并成功登录。

 

请求参数
Body 参数， 非必传参数可以不传递，传参格式为JSON

参数名称

类型

必传

说明

os

integer(int32)

是

对应不同的操作系统

1：Windows，2：macOS，3：Android，4：IOS

ua

string

否

UA

 
请求示例
{
    "os": 0,
    "ua": ""
}
返回数据
{
    "code": 0, // 返回结果编码 0:正常 其他编码都是异常
    "msg": "", // 错误信息
    "data": [
            {
                "id": "", // 分辨率ID
                "value": "" // 分辨率值
            }
    ],
    "requestId": "", // 操作请求ID
}
12、获取可配置平台
基本信息
GET  /api/system/platform/list

接口描述: 获取可用的平台信息。需将MoreLogin应用更新至2.14.0及以上版本。

 

返回数据
{
	"code": 0,  // 返回结果编码 0:正常 其他编码都是异常
	"msg": "",  // 错误信息
	"data": [
		{
			"categoryId": 0,  // 分类ID
			"groupName": "",  // 分组名称
			"groups": 0,      // 分组，0：亚马逊
			"id": 0,          // 平台ID
			"isCustomer": true,  // 是否自定义平台
			"logo": "",       // 平台图标
			"name": "",       // 平台名称
			"orderNo": 0,     // 排序编号
			"sites": [        // 站点信息
				{
					"country": "",   // 国家
					"host": "",      // 站点域名
					"id": 0,         // 站点ID
					"isDefault": true, // 语言ID
					"logo": "",      // 图标
					"name": "",      // 站点名称
					"nameBak": "",   // 站点名称备份
					"url": ""        // 站点地址
				}
			]
		}
	]
	"requestId": "",   // 操作请求ID
}
13、获取浏览器安全锁状态
基本信息
POST  /api/env/lock/query

接口描述: 获取环境安全锁锁定状态。需将MoreLogin应用更新至2.14.0及以上版本。

注：使用此接口需启动MoreLogin客户端并成功登录。

 

请求参数
Body 参数， 非必传参数可以不传递，传参格式为JSON

参数名称

类型

必传

说明

envId

integer(int64)

是

环境ID

 
请求示例
{
    "envId": 0
}
返回数据
{
	"code": 0,  // 返回结果编码 0:正常 其他编码都是异常
	"msg": "",  // 错误信息
	"data": {
		"envId": 0,     // 环境ID
		"locked": true  // 是否已被他人锁定
	},
	"requestId": "",   // 操作请求ID
}
14、获取时区语言列表
基础信息
POST  /api/env/base/list

接口描述: 获取可用的时区和语言。需将MoreLogin应用更新至2.14.0及以上版本。

注：使用此接口需启动MoreLogin客户端并成功登录。

  

请求参数
Body 参数， 非必传参数可以不传递，传参格式为JSON参数名称

类型

必传

说明

 

os

integer(int32)

否

操作系统类型

1：Windows，2：macOS，3：Android，4：IOS

 
请求示例
{
    "os": 0
}
返回数据
{
	"code": 0,  // 返回结果编码 0:正常 其他编码都是异常
	"msg": "",  // 错误信息
	"data" {
		"language_list": [   // 语言列表
			{
				"id": "",    // 语言ID
				"value": ""  // 语言信息
			}
		],
		"time_zone_list": [  // 时区列表
			{
				"id": "",    // 时区ID
				"value": ""  // 时区信息
			}
		]
	},
	"requestId": "",   // 操作请求ID
}
15、清除环境本地缓存
基础信息
POST  /api/env/removeLocalCache

描述:清除本地配置文件缓存。需要将 MoreLogin 应用程序更新至 2.28.0 及以上版本。

 

请求参数
参数格式为 JSON。

参数名称

类型

必传

描述

envId

string

NO

环境 ID：有且只能有一个环境ID 和环境号。

uniqueId

integer(int32)

NO

环境编号：有且只能有一个环境ID 和环境号。

localStorage

boolean

NO

是否清除 LocalStorage，默认为否

indexedDB

boolean

NO

是否清除 IndexedDB，默认为否

cookie

boolean

NO

是否清除 cookie，默认为否

extension

boolean

NO

是否清除扩展，默认为否

是：清除扩展和扩展数据，如果extensionFile 没有传值

否：不清除

extensionFile

boolean

NO

是否清除扩展，默认为否，不清除

注：需升级到 V2.36.0 及以上版本

 
 

请求示例
{
      "envId": "",  
      "localStorage": true, 
      "indexedDB": false,  
      "cookie": false,  
      "extension": false
}
返回数据
{
	"code": 0,  // Return result code 0:Normal Other codes are exceptions.
	"msg": "",  // Error message
	"data" {	             
           "envId": "",        
        "requestId":"",   // Operation request ID
	}
}
16、刷新指纹
基础信息
POST  /api/env/fingerprint/refresh

描述:刷新指纹。需要将 MoreLogin 应用程序更新至 2.28.0 及以上版本。

 

请求参数
参数格式为 JSON。

参数格式

类型

必传

描述

envId

string

NO

环境 ID：有且只能有一个环境ID 和环境号。

uniqueId

integer(int32)

NO

环境编号：有且只能有一个环境ID 和环境号。

browserTypeld

integer(int32)

yes

浏览器类型：

1.Chrome 2.Firefox

operatorSystemld

integer(int32)

yes

操作系统类型

1:Windows  2:macOS

3:Android   4:1OS

uaVersion

integer(int32)

NO

UA 版本，默认为否

advancedSetting

object

NO

高级配置，详见高级创建接口

 
请求案例
{
	"envId": ""，
        "uaVersion": 129， //   UA version according to the Profile
        "advancedSetting": {}
}
返回参数
{
	"code": 0,  // Return result code 0:Normal Other codes are exceptions.
	"msg": "",  // Error message
	"data": "", 	             
        "requestId":"",   // Operation request ID
}
17、获取浏览器环境运行状态
基础信息
POST  /api/env/status

描述:该接口用于查询指定浏览器环境的当前状态（开启或关闭）。用户需要提供环境ID，接口将返回该环境的状态信息。需要将 MoreLogin 应用程序更新至 2.34.0 及以上版本。

 

请求参数
请求参数应采用JSON格式传递，具体参数如下：

参数格式

类型

必传

描述

envId

string

YES

环境 ID：有且只能有一个环境ID 和环境号。

 
请求案例
{
    "envId": "123456789"
}
 

返回参数
参数格式

类型

描述

code

int

返回结果编码，0表示正常，其他编码表示异常

msg

string

错误信息，当code不为0时返回具体的错误描述

data

object

返回的数据对象，包含以下字段： - envId (integer): 浏览器环境ID - status (string): 环境状态，可能的值为"running"（运行中）或"stopped"（已停止）-localStatus：浏览器本地状态，可能的值为"running"（运行中）或"stopped"（已停止）-debugPort 调试接口 -webdriver 驱动

requestId

string

操作请求ID，用于追踪请求

 
{
    "code": 0,
    "msg": null,
    "data": {
        "envId": "1898275641388867584",
        "status": "running",
        "localStatus": "running",
        "debugPort": "50979",
        "webdriver": "C:\\Users\\Administrator\\AppData\\Roaming\\MoreLogin\\env-kit\\Core\\chrome_64_132.3\\webdriver.exe"
    }
}
注意事项

• 确保envId的有效性，即该ID对应的浏览器环境存在。

• 返回的status字段仅包含"running"或"stopped"两种状态，分别表示环境正在运行或已停止。

• 如果请求的envId不存在，code应返回特定的错误码，并在msg中给出相应的错误描述。

 

18、获取手机机型列表
基本信息
POST  /api/env/base/mobile/devices

 

描述: 查询手机机型ID、机型名称、分辨率 等信息，机型ID可用于高级创建环境 

 

返回数据
  {
     "code": 0, // 返回结果编码 0:正常 其他编码都是异常
     "msg": "", // 错误信息
     "data": [
​     
          {
                           "id": "1939877823533096960",
                           "name": "iPhone 16 Pro Max",

                           "resolution": "440x956",

                           "os": 4,

                           "platform": "iPhone
             }
            ]  ,
    "requestId": "", // 操作请求ID
}


使用说明
超过 11 个月前更新
1、功能概述
API功能可以帮助您通过程序化的方式来进行快速创建云手机环境、开启和关闭云手机环境等基础功能。还可以可通过ADB模式，对云手机进行ADB调试或远程控制。

 

2、使用方法
本文档内容中示例代码来自于：MoreLogin API Demos以及Run in Postman

2.1 打开 MoreLogin 客户端，获得API接口

2.2 通过「环境管理」->「API」确认接口状态、API ID、API Key

2.3 检查API页中的接口状态为成功，当前版本API接口地址: http://127.0.0.1:40000 ，端口号以设置中看到的地址为准。


2.4 通过配置“回调地址”，可接收API操作的信息。目前的回调场景有：云手机开启成功



3、无界面服务
MoreLogin 支持headless启动无界面服务操作Local API

headless：启动无界面服务的参数

请确保您在MoreLogin主目录中 -安装目录（MoreLogin/MoreLogin Global）打开了您的CMD或Terminal

命令行启动

启动无界面服务时，支持传入的参数为：

参数

是否必填

说明

--headless

是

值为ture时，指的是无界面服务

--api-port

是

指定的 Local API 服务端口

 
MoreLogin Global：
Windows设备下：start /WAIT MoreLogin.exe --headless=true --port=51473
MacOS设备下："/Applications/MoreLogin.app/Contents/MacOS/MoreLogin" --headless=true --port=4000


Header公共参数
本周更新
Header公共参数
所有API都要求在请求的Header内，添加如下参数：

参数名称

类型

必传

描述

Content-Type

String

是

application/json

X-Api-Id

String

否

环境管理中API设置页面中的 API ID 值

X-Nonce-Id

String

否

必需，全局唯一ID，调用方生成，参考算法：

{Client-Timestamp} + ":" + {Random String-UUID}

Authorization

String

否

签名参数，取值算法：MD5(API ID + NonceId + SecretKey)

- API ID：必需，环境管理中API设置页面中的 API ID 值

- NonceId：必需，全局唯一ID（即前一个参数：X-Nonce-Id的值）

- SecretKey：必需，环境管理中API设置页面中的 API Key 值

 
 

签名参数举例：

 

假设：

- API ID: 123456789

- NonceId: abcdef

- SecretKey: uvwxyz

则Authorization的取值为：

MD5("123456789abcdefuvwxyz") = "2d3ad29bb2f48b569521ae0791bc5ca2"



代理管理
超过 3 个月前更新
1. 获取代理列表
基本信息

POST  /api/proxyInfo/page

接口描述：查询已添加的代理信息。需将MoreLogin应用更新至2.9.0及以上版本

 

请求参数

Body 参数， 非必传参数可以不传递，传参格式为JSON

参数名称

类型

必传

说明

id

integer(int64)

否

需要查询的代理ID

isCloudPhoneProxy

boolean

否

是否为云手机环境可以使用的代理 true：是；false：否

pageNo

integer(int64)

否

当前页，默认：1

pageSize

integer(int64)

否

每页条数，默认：10

proxyCategoryType

integer(int32)

否

通过代理分类查询

1：云平台；2：自有IP

proxyCheckStatus

integer(int32)

否

通过检测状态查询

0：待检测，1：检测成功，2：检测失败，3：未知错误

proxyIp

string

否

代理IP

proxyName

string

否

通过代理名称查询，支持模糊搜索

proxyProviders

array

否

通过代理提供商查询

0：无，4：Oxylabs，5：Proxys.io，7：Luminati，8：Lumauto，9：Oxylabsauto，10：Trojan，11：Shadowsocks，13：ABCPROXY，14：LunaProxy，15：IPHTML，16：PiaProxy，17：922S5

默认值：0

proxyStatus

integer(int32)

否

通过代理状态查询

0：正常 ，1：待分配 ，2：升级中 ，3：已过期，4：即将过期

proxyTypes

array

否

通过代理类型查询

0：http，1：https，2：socks5，3：ssh

 
请求示例

{
    "id": 0,
    "isCloudPhoneProxy": true,
    "pageNo": 0,
    "pageSize": 0,
    "proxyCategoryType": 0,
    "proxyIp": "",
    "proxyName": "",
    "proxyProviders": [],
    "proxyStatus": 0,
    "proxyTypes": []
}
 

返回数据

{
    "code": 0, // 返回结果编码 0:正常 其他编码都是异常
    "msg": "", // 错误信息
    "data": {
    "current": 0,
    "dataList": [
           {
              "expiryTime": 0, //过期时间
              "id": 0, //主键
              "proxyCategoryType": 0, //代理分类：1-云平台 2-自有IP
              "proxyCheckStatus": 0, //检测状态：0-待检测 1-监测成功 2-检测失败 3-未知错误
              "proxyIp": "", //代理Ip
              "proxyName": "", //代理名称
              "proxyProvider": 0, //代理提供商：默认值0-无 4-Oxylabs 5-Proxys.io 7-Luminati 8-Lumauto 9-Oxylabsauto 10-Trojan，11-Shadowsocks 13-ABCPROXY 14-LunaProxy 15-IPHTML 16-PiaProxy 17-922S5
              "proxyType": 0 //代理类型：0-http 1-https 2-socks5 3-ssh
              "username":"XXX", //代理账号
              "password":"xxx", //代理密码
              "refreshUrl":"https://xxx" // 代理刷新URL
           }
      ],
    "pages": 0,
    "total": 0
     },
    "requestId": "", // 操作请求ID
}
 

2. 添加代理
基本信息

POST  /api/proxyInfo/add

接口描述：新增自有代理。需将MoreLogin应用更新至2.9.0及以上版本。

请求参数

Body 参数， 非必传参数可以不传递，传参格式为JSON

 

参数名称

类型

必传

说明

city

string

否

城市

country

string

否

国家（具体的国家码详见附录），proxyProvider为16/17/18必填

encryptionType

integer(int32)

否

加密方式，proxyProvider为11时不可为空。

1：aes-128-gcm，2：aes-192-gcm，3：aes-256-gcm，4：aes-128-cfb，5：aes-192-cfb，6：aes-256-cfb，7：aes-128-ctr，8：aes-192-ctr，9：aes-256-ctr，10：rc4-md5，11：chacha20-ietf，12：xchacha20，13：chacha20-ietf-poly1305，14：xchacha20-ietf-poly1305

ipChangeAction

boolean

否

IP变化监控

0：禁止访问，1：警告

ipMonitor

integer(int32)

否

是否开启IP变化监控

true：打开，false：关闭

默认：关闭

password

string

否

密码（最多100字符）

proxyIp

string

否

代理IP，proxyProvider为16/17/18可为空，其他则必填

proxyName

string

否

代理名称（最多600字符）

proxyPort

integer(int32)

否

代理端口（仅支持输入1-65535的数字），proxyProvider为16/17/18可为空，其他则不可为空

proxyProvider

integer(int32)

否

代理提供商

0：http，1：https，2：socks5，3：ssh，4：Oxylabs，5：Proxys.io，7：Luminati，8：Lumauto，9：Oxylabsauto，10：Trojan，11：Shadowsocks，13：ABCPROXY，14：LunaProxy，15：IPHTML，16：PiaProxy，17：922S5，18：360Proxy

proxyType

integer(int32)

否

代理类型，0：http，1：https，proxyProvider为7/8时不可为空

refreshUrl

string

否

刷新URL

state

string

否

州/省

username

string

否

用户名（最多200字符）

 
请求示例

{
    "city": "",
    "country": "",
    "encryptionType": 0,
    "ipChangeAction": 0,
    "ipMonitor": true,
    "password": "",
    "proxyIp": "",
    "proxyName": "",
    "proxyPort": 0,
    "proxyProvider": 0,
    "proxyType": 0,
    "refreshUrl": "",
    "state": "",
    "username": ""
}
 

返回数据

{
    "code": 0, // 返回结果编码 0:正常 其他编码都是异常
    "msg": "", // 错误信息
    "data": 0, // 代理ID
    "requestId": "", // 操作请求ID
}
 

3. 修改代理信息
 

基本信息

POST  /api/proxyInfo/update

接口描述：修改代理相关信息。需将MoreLogin应用更新至2.9.0及以上版本。

 

请求参数

Body 参数， 非必传参数可以不传递，传参格式为JSON

参数名称

类型

必传

说明

city

string

否

城市

country

string

否

国家（具体的国家码详见附录），proxyProvider为16/17/18必填

encryptionType

integer(int32)

否

加密方式，proxyProvider为11时不可为空。

1：aes-128-gcm，2：aes-192-gcm，3：aes-256-gcm，4：aes-128-cfb，5：aes-192-cfb，6：aes-256-cfb，7：aes-128-ctr，8：aes-192-ctr，9：aes-256-ctr，10：rc4-md5，11：chacha20-ietf，12：xchacha20，13：chacha20-ietf-poly1305，14：xchacha20-ietf-poly1305

id

integer(int64)

是

代理ID

ipChangeAction

integer(int32)

否

是否开启IP变化监控

true：打开，false：关闭

ipMonitor

boolean

否

IP变化监控

0：禁止访问，1：警告 

password

string

否

密码（最多100字符）

proxyIp

string

否

代理IP，proxyProvider为16/17/18可为空，其他则必填

proxyName

string

否

代理名称（最多600字符）

proxyPort

integer(int32)

否

代理端口（仅支持输入1-65535的数字），proxyProvider为16/17/18可为空，其他则不可为空

proxyProvider

integer(int32)

否

代理提供商

0：http，1：https，2：socks5，3：ssh，4：Oxylabs，5：Proxys.io，7：Luminati，8：Lumauto，9：Oxylabsauto，10：Trojan，11：Shadowsocks，13：ABCPROXY，14：LunaProxy，15：IPHTML，16：PiaProxy，17：922S5，18：360Proxy

proxyType

integer(int32)

否

代理类型，0：http，1：https，proxyProvider为7/8时不可为空

refreshUrl

string

否

刷新URL

state

string

否

州/省

username

string

否

用户名（最多200字符）

 
请求示例

{
    "city": "",
    "country": "",
    "encryptionType": 0,
    "id": 0,
    "ipChangeAction": 0,
    "ipMonitor": true,
    "password": "",
    "proxyIp": "",
    "proxyName": "",
    "proxyPort": 0,
    "proxyProvider": 0,
    "proxyType": 0,
    "refreshUrl": "",
    "state": "",
    "username": ""
}
 

返回数据

{
    "code": 0, // 返回结果编码 0:正常 其他编码都是异常
    "msg": "", // 错误信息
    "requestId": "", // 操作请求ID
}
 

4. 删除代理
基本信息

POST  /api/proxyInfo/delete

接口描述：批量删除不需要的代理。需将MoreLogin应用更新至2.9.0及以上版本。

 

请求参数

Body 参数， 非必传参数可以不传递，传参格式为JSON

参数名称

类型

必传

说明

ids

array

是

需要删除的代理ID，可批量删除（未过期的平台代理无法删除）

 
请求示例

[1054661322597744600,1054661322597744601]
 

返回数据

{
    "code": 0, // 返回结果编码 0:正常 其他编码都是异常
    "msg": "", // 错误信息
    "requestId": "", // 操作请求ID
}


分组管理—API
超过 10 个月前更新
1. 获取分组列表
基本信息
POST  /api/envgroup/page

接口描述：查询分组信息，分组信息包括分组ID和分组名称，其中分组ID用于给环境分组。需将MoreLogin应用更新至2.9.0及以上版本。

请求参数
Body 参数， 非必传参数可以不传递，传参格式为JSON

参数名称

类型

必传

说明

pageNo

integer(int64)

是

当前页，默认：1

pageSize

integer(int64)

是

每页条数，默认：20

groupName

string

否

按分组名称查询

 
 

请求示例
{
    "pageNo": 1,
    "pageSize": 10,
    "groupName": ""
}
返回数据
{{
    "code": 0, // 返回结果编码 0:正常 其他编码都是异常
    "msg": "", // 错误信息
    "data": {
             "current": 0,
             "dataList": [
                      {
                         "id": 0, // 分组ID
                         "groupName": "" // 分组名称
                      }
            ],
            "pages": 0,
            "total": 0
    },
   "requestId": "", // 操作请求ID
}
2. 新建分组
基本信息
POST  /api/envgroup/create

接口描述：添加分组，添加成功后可用于将环境进行分组操作，名称不能重复，创建成功后将返回分组ID。需将MoreLogin应用更新至2.9.0及以上版本。

请求参数
Body 参数， 非必传参数可以不传递，传参格式为JSON

参数名称

类型

必传

说明

groupName

string

是

分组名称

 
请求示例
{
    "groupName": ""
}
返回数据
{
    "code": 0, // Return result code 0:Normal Other codes are exceptions.
    "msg": "", // Error message
    "data": 0, // The data returned by the operation
    "requestId": "", // Operation Request ID
}
3. 修改分组信息
基础信息
POST/api/envgroup/edit

接口描述: 修改分组信息，可以修改分组名称，名称不能重复。需将MoreLogin应用更新至2.14.0及以上版本。

请求参数
Body 参数， 非必传参数可以不传递，传参格式为JSON

参数名称

类型

必传

说明

groupName

string

是

分组名称

id

integer(int64)

是

分组ID

 
请求示例
{
    "groupName": "",
    "id": 0
}
返回数据
{
    "code": 0, // Return result code 0:Normal Other codes are exceptions.
    "msg": "", // Error message
    "data": true,
    "requestId": "", // Operation Request ID
}
 

4 删除分组
基础信息
POST  /api/envgroup/delete

接口描述: 删除指定的分组。需将MoreLogin应用更新至2.14.0及以上版本。

请求参数
Body 参数， 非必传参数可以不传递，传参格式为JSON

参数名称

类型

必传

说明

ids

array

是

分组ID

isDeleteAllEnv

boolean

否

是否同时删除分组内的环境，默认：false

false：不删除，true：删除

 
请求示例
{
    "ids": [],
    "isDeleteAllEnv": false
}
返回数据
{
    "code": 0, // Return result code 0:Normal Other codes are exceptions.
    "msg": "", // Error message
    "data": true,
    "requestId": "", // Operation Request ID
}


标签管理
超过 10 个月前更新
1. 获取标签列表
基本信息
GET  /api/envtag/all

Interface description: 查询标签信息，标签信息包括标签ID和标签名称，其中标签ID用于给环境设置标签。需将MoreLogin应用更新至2.14.0及以上版本。

返回数据
{
    "code": 0, // Return result code 0:Normal Other codes are exceptions.
    "msg": "", // error message
    "data": [
           {
               "id": 0, // ID of tags
               "tagName": "" // Name of tags
           }
    ],
    "requestId": "", // Operation Request ID
}
2. 新建标签
基本信息
POST  /api/envtag/create

接口描述: 添加标签，添加成功后可用于给环境设置标签的操作，创建成功后将返回标签ID。需将MoreLogin应用更新至2.14.0及以上版本。

请求参数
Body 参数， 非必传参数可以不传递，传参格式为JSON

参数名称

类型

必传

说明

tagName

string

是

标签名称

 
请求示例
{
    "tagName": ""
}
返回数据
{
    "code": 0, // Return result code 0:Normal Other codes are exceptions.
    "msg": "", // error message
    "data": {
            "id": 0, // ID of tags
            "tagName": "" // Name of tags
    },
    "requestId": "", // Operation Request ID
}
3. 修改标签信息
基本信息
POST /api/envtag/edit

接口描述: 修改标签信息，可以修改标签名称。需将MoreLogin应用更新至2.14.0及以上版本。

请求参数
Body 参数， 非必传参数可以不传递，传参格式为JSON.

参数名称

类型

必传

说明

id

integer(int64)

是

标签ID

tagName

string

是

标签名称

 
请求示例
{
    "tagName": "",
    "id": 0,
}
返回数据
{
    "code": 0, // Return result code 0:Normal Other codes are exceptions.
    "msg": "", // Error message
    "data": true,
    "requestId": "", // Operation Request ID
}
4. 删除标签
基本信息
POST  /api/envtag/delete

接口描述: 删除指定的标签。需将MoreLogin应用更新至2.14.0及以上版本。

请求参数
Body 参数， 非必传参数可以不传递，传参格式为JSON

参数名称

类型

必传

说明

ids

array

是

分组ID

 
请求示例
{
    "ids": []
}
返回数据
{
    "code": 0, // Return result code 0:Normal Other codes are exceptions.
    "msg": "", // Error message
    "data": true, 
    "requestId": "", // 操作请求ID
}