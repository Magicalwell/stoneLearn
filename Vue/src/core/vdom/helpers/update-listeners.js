// updateListeners(listeners, oldListeners || {}, add, remove, createOnceHandler, vm)
import { cached, isUndef } from 'shared/util'

const normalizeEvent = cached((name) => {
  const passive = name.charAt(0) === '&'
  name = passive ? name.slice(1) : name
  const once = name.charAt(0) === '~'
  name = once ? name.slice(1) : name
  const capture = name.charAt(0) === '!'
  name = capture ? name.slice(1) : name
  return {
    name,
    once,
    capture,
    passive
  }
})
export function updateListeners(on, oldOn, add, remove, createOnceHandler, vm) {
  // 这里是通过对比on oldon来根据对比结果调用add remove等进行新增和删除
  let name, def, cur, old, event
  for (name in on) {
    // 此时on中是父组件在子组件标签上注册的一些事件监听方法，例如
    // { update:handleclick()... } 在创建阶段是没用oldOn的，所以只会调用add去新增
    def = cur = on[name]
    old = oldOn[name]
    event = normalizeEvent(name)
    if (isUndef(old)) {
      if (isUndef(cur.fns)) {
        cur = on[name] = createFnInvoker(cur, vm)
        //这里createFNinvoker是对cur这里的cur是父组件注册的方法，例如上面的handleclick，对它进行错误处理的封装再返回，这里处理错误可以被errorhandler捕获，也会被globalhandler捕获，类似于冒泡。

        // 详细解析见：https://blog.51cto.com/u_15478221/5225649?u_atoken=95983aad-b1c9-480a-ac31-b8c3104ab365&u_asession=01zokX2sQCrD-Z14s88G4xwkTODupIjexuurGvORBVQidwd_yDgakavPLf1pgwjp9iX0KNBwm7Lovlpxjd_P_q4JsKWYrT3W_NKPr8w6oU7K-8hPz3zR2xtRlUpgy4QxG37M7LQXJnBaowJRZr2iY6bGBkFo3NEHBv0PZUm6pbxQU&u_asig=05Z6NcKy0zBHRKYB83RslIJqE45Es8LK2wd1jdYRiabhT3Jvk_gXrXueO2p7GAOzY0PBWOXo5aYx-GYU_JdQyiG2uOMgFTX4gjEPzfV-NqvxLwRikCSiHNhTqp2gvr4Sq6NtAyG1t2H4cgJYTJNSY-UkdTr2aVFS-zP0Ypcu5M5CT9JS7q8ZD7Xtz2Ly-b0kmuyAKRFSVJkkdwVUnyHAIJzbyhGPmYJUjH3jKaNrMia9pBDO-7Y1XOloK66KZNgoNlBlbJZYb9ylbWGsgfAOaAnu3h9VXwMyh6PgyDIVSG1W_GMTF66FZzPhYiifVsGuEM3yLY6mZgdXquFtyGe0DhelDnwXxU8IQLmcKZe-eATWKxwDJpQPuCwf6y2Kp_geSJmWspDxyAEEo4kbsryBKb9Q&u_aref=EmgFkBq8YfikEKi514yNGHQ%2F2qE%3D
      }
      if (isTrue(event.once)) {
        cur = on[name] = createOnceHandler(event.name, cur, event.capture) //对$once的处理
      }
      add(event.name, cur, event.capture, event.passive, event.params)
    } else if (cur !== old) {
      old.fns = cur
      on[name] = old
    }

  }
  for (name in oldOn) {
    if (isUndef(on[name])) {
      // 新的不存在则调用删除
      event = normalizeEvent(name)
      remove(event.name, oldOn[name], event.capture)
    }
  }
}