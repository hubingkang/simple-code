const setAttribute = (node, key, value) => {
    switch (key) {
        case 'style':
            node.style.cssText = value
            break
        case 'value':
            let tagName = node.tagName || ''
            tagName = tagName.toLowerCase()
            if (
                tagName === 'input' || tagName === 'textarea'
            ) {
                node.value = value
            } else {
                // 如果节点不是 input 或者 textarea, 则使用 setAttribute 去设置属性
                node.setAttribute(key, value)
            }
            break
        default:
            node.setAttribute(key, value)
            break
    }
}

/**
 * 虚拟 DOM 生成类
 */
class Element {
    constructor(tagName, attributes = {}, children = []) {
        this.tagName = tagName
        this.attributes = attributes
        this.children = children
    }

    // 将虚拟 DOM 渲染成真实 DOM 片段
    render() {
        let element = document.createElement(this.tagName)
        let attributes = this.attributes

        for (let key in attributes) {
            setAttribute(element, key, attributes[key])
        }

        let children = this.children

        children.forEach(child => {
            let childElement = child instanceof Element
                ? child.render() // 若 child 也是虚拟节点，递归进行
                : document.createTextNode(child)  // 若是字符串，直接创建文本节点
            element.appendChild(childElement)
        })

        return element
    }
}

function element(tagName, attributes, children) {
    return new Element(tagName, attributes, children)
}

const renderDom = (element, target) => {
    target.appendChild(element)
}

/**
 * 
 * @param {Object} oldVirtualDom 
 * @param {Object} newVirtualDom 
 */
const diff = (oldVirtualDom, newVirtualDom) => {
    let patches = {}

    // 递归树 比较后的结果放到 patches
    walkToDiff(oldVirtualDom, newVirtualDom, 0, patches)

    return patches
}

let initialIndex = 0

const walkToDiff = (oldVirtualDom, newVirtualDom, index, patches) => {
    let diffResult = []

    // 如果 newVirtualDom 不存在，说明该节点被移除，我们将 type 为 REMOVE 的对象推进 diffResult 变量，并记录 index
    if (!newVirtualDom) {
        diffResult.push({
            type: 'REMOVE',
            index
        })
    }
    // 如果新旧节点都是文本节点，是字符串
    else if (typeof oldVirtualDom === 'string' && typeof newVirtualDom === 'string') {
        // 比较文本是否相同，如果不同则记录新的结果
        if (oldVirtualDom !== newVirtualDom) {
            diffResult.push({
                type: 'MODIFY_TEXT',
                data: newVirtualDom,
                index
            })
        }
    }
    // 如果新旧节点类型相同
    else if (oldVirtualDom.tagName === newVirtualDom.tagName) {
        // 比较属性是否相同
        let diffAttributeResult = {}

        for (let key in oldVirtualDom) {
            if (oldVirtualDom[key] !== newVirtualDom[key]) {
                diffAttributeResult[key] = newVirtualDom[key]
            }
        }

        for (let key in newVirtualDom) {
            // 旧节点不存在的新属性
            if (!oldVirtualDom.hasOwnProperty(key)) {
                diffAttributeResult[key] = newVirtualDom[key]
            }
        }

        if (Object.keys(diffAttributeResult).length > 0) {
            diffResult.push({
                type: 'MODIFY_ATTRIBUTES',
                diffAttributeResult
            })
        }

        // 如果有子节点，遍历子节点
        oldVirtualDom.children.forEach((child, index) => {
            walkToDiff(child, newVirtualDom.children[index], ++initialIndex, patches)
        })
    }
    // else 说明节点类型不同，被直接替换了，我们直接将新的结果 push
    else {
        diffResult.push({
            type: 'REPLACE',
            newVirtualDom
        })
    }

    if (!oldVirtualDom) {
        diffResult.push({
            type: 'REPLACE',
            newVirtualDom
        })
    }

    if (diffResult.length) {
        patches[index] = diffResult
    }
}

/**
 * 
 * @param {*} node 节点
 * @param {*} patches diff 算法比较出来的差异集合
 */
const patch = (node, patches) => {
    let walker = { index: 0 }
    walk(node, walker, patches)
}

const walk = (node, walker, patches) => {
    let currentPatch = patches[walker.index]

    let childNodes = node.childNodes

    // 递归调用
    childNodes.forEach(child => {
        walker.index++
        walk(child, walker, patches)
    })

    // 完成当前节点的差异更新
    if (currentPatch) {
        doPatch(node, currentPatch)
    }
}

const doPatch = (node, patches) => {
    patches.forEach(patch => {
        switch (patch.type) {
            case 'MODIFY_ATTRIBUTES':
                const attributes = patch.diffAttributeResult.attributes
                for (let key in attributes) {
                    if (node.nodeType !== 1) return
                    const value = attributes[key]
                    if (value) {
                        setAttribute(node, key, value)
                    } else {
                        node.removeAttribute(key)
                    }
                }
                break
            case 'MODIFY_TEXT':
                node.textContent = patch.data
                break
            case 'REPLACE':
                let newNode = (patch.newNode instanceof Element) ? render(patch.newNode) : document.createTextNode(patch.newNode)
                node.parentNode.replaceChild(newNode, node)
                break
            case 'REMOVE':
                node.parentNode.removeChild(node)
                break
            default:
                break
        }
    })
}


const chapterListVirtualDom = element('ul', { id: 'list' }, [
    element('li', { class: 'chapter' }, ['chapter1']),
    element('li', { class: 'chapter' }, ['chapter2']),
    element('li', { class: 'chapter' }, ['chapter3'])
])

const chapterListVirtualDom1 = element('ul', { id: 'list2' }, [
    element('li', { class: 'chapter2' }, ['chapter4']),
    element('li', { class: 'chapter2' }, ['chapter5']),
    element('li', { class: 'chapter2' }, ['chapter6'])
])

var element = chapterListVirtualDom.render()
renderDom(element, document.body)

const patches = diff(chapterListVirtualDom, chapterListVirtualDom1)
patch(element, patches)