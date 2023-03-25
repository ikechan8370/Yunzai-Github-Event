import lodash from 'lodash'
import fs from 'node:fs'
import puppeteer from '../../../lib/puppeteer/puppeteer.js'
/**
   *
   * @param plugin plugin key
   * @param path html文件路径，相对于plugin resources目录
   * @param data 渲染数据
   * @param cfg 渲染配置
   * @param cfg.retType 返回值类型
   * * default/空：自动发送图片，返回true
   * * msgId：自动发送图片，返回msg id
   * * base64: 不自动发送图像，返回图像base64数据
   * @param cfg.beforeRender({data}) 可改写渲染的data数据
   * @returns {Promise<boolean>}
   */

export async function render (plugin, path, data = {}, cfg = {}) {
  // 处理传入的path
  path = path.replace(/.html$/, '')
  let paths = lodash.filter(path.split('/'), (p) => !!p)
  path = paths.join('/')
  // 创建目录
  const mkdir = (check) => {
    let currDir = `${process.cwd()}/data`
    for (let p of check.split('/')) {
      currDir = `${currDir}/${p}`
      if (!fs.existsSync(currDir)) {
        fs.mkdirSync(currDir)
      }
    }
    return currDir
  }
  mkdir(`html/${plugin}/${path}`)
  // 自动计算pluResPath
  let pluResPath = `../../../${lodash.repeat('../', paths.length)}plugins/${plugin}/resources/`
  // 渲染data
  data = {
    ...data,
    _plugin: plugin,
    _htmlPath: path,
    pluResPath,
    tplFile: `./plugins/${plugin}/resources/${path}.html`,
    saveId: data.saveId || data.save_id || paths[paths.length - 1],
    pageGotoParams: {
      waitUntil: 'networkidle0'
    }
  }
  // 处理beforeRender
  if (cfg.beforeRender) {
    data = cfg.beforeRender({ data }) || data
  }
  // 保存模板数据
  if (process.argv.includes('web-debug')) {
    // debug下保存当前页面的渲染数据，方便模板编写与调试
    // 由于只用于调试，开发者只关注自己当时开发的文件即可，暂不考虑app及plugin的命名冲突
    let saveDir = mkdir(`ViewData/${plugin}`)
    let file = `${saveDir}/${data._htmlPath.split('/').join('_')}.json`
    fs.writeFileSync(file, JSON.stringify(data))
  }
  // 截图
  let base64 = await puppeteer.screenshot(`${plugin}/${path}`, data)
  if (cfg.retType === 'base64') {
    return base64
  }
  let ret = true
  if (base64) {
    ret = await this.e.reply(base64)
  }
  return cfg.retType === 'msgId' ? ret : true
}

export async function getMasterQQ () {
  return (await import('../../../lib/config/config.js')).default.masterQQ
}

export function formatDate (date) {
  const year = date.getFullYear()
  const month = date.getMonth() + 1 // Note that getMonth() returns a zero-based index
  const day = date.getDate()
  const hour = date.getHours()
  const minute = date.getMinutes()

  const formattedDate = `${year}年${month}月${day}日 ${hour}:${minute}`
  return formattedDate
}
