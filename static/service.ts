/* eslint-disable @typescript-eslint/no-non-null-assertion */
/**
 * @description 增量更新操作界面逻辑
 */

// @ts-ignore service.ts 编译规则和 src 不一致
// eslint-disable-next-line prettier/prettier
declare let jsondiffpatch: any;
/** 差异 */
declare let delta: any;
/** 当前 swagger 版本 */
declare let curVersion: any;
/** 新 swagger 版本 */
declare let diffVersion: any;

/** 新 swagger 版本 */
declare let newVersion: any;

declare const Autos: {
  exports: {
    getExplicitModelDeps(obj: {} | undefined): string[] | undefined;
    resolveModelDeps(models?: string[], definitions?: any, resolvedDeps?: any): void;
  };
};

{
  /* eslint-disable no-undef */
  const title = (document.title = 'swagger 增量同步工具');
  const ChangedClassName = 'select-change';
  const keySeparator = '@@__S__@@';

  const canvas = document.querySelector<HTMLDivElement>('#canvas') as HTMLDivElement;
  const menu = document.querySelector<HTMLDivElement>('#menu') as HTMLDivElement;

  canvas.innerHTML = jsondiffpatch.formatters.html.format(delta, curVersion);

  /** 隐藏未修改 */
  function hide() {
    jsondiffpatch.formatters.html.hideUnchanged();
  }

  /** 显示未修改 */
  function show() {
    jsondiffpatch.formatters.html.showUnchanged();
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  function toggleUnchanged(me: HTMLInputElement) {
    const checked = me.checked;
    if (checked) {
      show();
    } else {
      hide();
    }
  }
  function toggleSelectAll(me: HTMLInputElement) {
    const checked = me.checked;
    const allChangedInput = document.querySelectorAll<HTMLInputElement>(`.${ChangedClassName}`);
    const deletedExcluded = (document.getElementById('仅不选择删除') as HTMLInputElement)!.checked;
    const addedIncluded = (document.getElementById('仅选择新增') as HTMLInputElement)!.checked;
    if (allChangedInput) {
      [].forEach.call(allChangedInput, (node: HTMLInputElement) => {
        if (
          (deletedExcluded &&
            (node.parentNode as HTMLDivElement)!.className.indexOf('-deleted') !== -1) ||
          (addedIncluded && (node.parentNode as HTMLDivElement)!.className.indexOf('-added') === -1)
        ) {
          // 排除
          node.checked = false;
        } else {
          node.checked = checked;
        }
      });
    }
    setCount();
  }

  /** 仅不选择删除 */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  function excludeDelete(me: HTMLInputElement) {
    setTimeout(function () {
      const all = document.getElementById('全选/取消全选') as HTMLInputElement;
      all.checked = true;
      toggleSelectAll(all);
    });
  }

  /** 仅选择新增 */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  function onlyAdd(me: HTMLInputElement) {
    setTimeout(function () {
      const all = document.getElementById('全选/取消全选') as HTMLInputElement;
      all.checked = true;
      toggleSelectAll(all);
    });
  }

  /** 显示选中修改状态 */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  function showStatus(me: HTMLInputElement) {
    const addedEle = document.getElementById('仅显示新增') as HTMLInputElement;
    const deletedEle = document.getElementById('仅显示删除') as HTMLInputElement;
    const modifiedEle = document.getElementById('仅显示修改') as HTMLInputElement;
    const propertyNameEle = document.getElementById('仅显示属性名') as HTMLInputElement;
    if (me !== propertyNameEle) {
      if (me === modifiedEle) {
        addedEle.checked = false;
        deletedEle.checked = false;
      } else {
        modifiedEle.checked = false;
      }
    }
    const added = addedEle.checked;
    const deleted = deletedEle.checked;
    const modified = modifiedEle.checked;
    const addedAndDeleted = added && deleted;
    const propertyNameOnly = propertyNameEle.checked;
    (document.getElementById('canvas') as HTMLDivElement).className = `${
      modified
        ? 'show-modified-only canvas'
        : addedAndDeleted
          ? 'show-added-deleted-only canvas'
          : added
            ? 'show-added-only canvas'
            : deleted
              ? 'show-add-deleted canvas'
              : 'canvas'
      }${propertyNameOnly ? ' show-only-property-name' : ''}`;
  }
  const help = `<div class="help-info" id="help-info" style="display: none;">
  <b>查看更新信息</b>
  <p>
  通过“显示*”相关的选择框，只查看我们真正关注的信息，比如“仅显示删除”、“仅显示新增”。
  </p>
  <p>
  通过“仅显示属性名”，查看变更概览，比如“paths”、“definitions”关键节点上，有多少内容新增、删除。
  </p>
  <b>增量更新</b>
  <p>
  通过“选择*”相关的选择框，选择性同步远端Swagger文档差异到本地，比如在后端多分支并行开发的情况下，会出现“误删除”差异，这个时候可以通过“仅不选择删除”来同步除了删除之外的所有差异。
  </p>
  <b>自动选择依赖</b>
  <p>按住 shift 按键勾选新增的接口 path 或者 model，将自动解析并选中其依赖的其他 Model。</p>
  <b>社区支持</b>
  <p>wx+: skipper_yqj</p>
  </div>`;

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  function toggleHelp(e: MouseEvent) {
    e.stopImmediatePropagation();
    const helpInfo = document.getElementById('help-info');
    if (helpInfo) {
      helpInfo.style.display = helpInfo.style.display === 'none' ? 'block' : 'none';
      helpInfo.onclick = e => {
        e.stopImmediatePropagation();
      };
    }
  }

  document.body.onclick = () => {
    const helpInfo = document.getElementById('help-info');
    if (helpInfo) {
      helpInfo.style.display = 'none';
    }
  };

  menu.innerHTML =
    [
      [
        '仅显示新增',
        'showStatus',
        '',
        '',
        `(${document.querySelectorAll('.jsondiffpatch-added').length}处)`
      ],
      [
        '仅显示删除',
        'showStatus',
        '',
        '',
        `(${document.querySelectorAll('.jsondiffpatch-deleted').length}处)`
      ],
      [
        '仅显示修改',
        'showStatus',
        '',
        '',
        `(${document.querySelectorAll('.jsondiffpatch-modified').length}处)`
      ],
      ['显示未变更', 'toggleUnchanged'],
      ['仅显示属性名', 'showStatus'],
      ['全选/取消全选', 'toggleSelectAll'],
      ['仅不选择删除', 'excludeDelete'],
      ['仅选择新增', 'onlyAdd'],
      ['同步已选择更新', 'patch', '', 'button']
    ].reduce((html, item) => {
      const [zero, callback, three, tagName, extra] = item;
      const name = zero || three;
      html += tagName
        ? `
      <button id="${name}" onClick="${callback}(this)" type="checkbox" name="${name}">${name}</button>
    `
        : `
    <input id="${name}" onClick="${callback}(this)" type="checkbox" name="${name}"><label id="for${name}" for="${name}">${name}${
        extra !== undefined ? extra : ''
        }</label>
    `;
      return html;
    }, '') + `<a class="help-icon" onClick="toggleHelp(event)">?</a>${help}`;
  const counter = document.createElement('div');
  counter.className = 'select-count';
  document.body.appendChild(counter);

  function setCount() {
    counter.innerHTML = `已选：${getAllSelect().length} / ${getAllChanged().length} 处`;
  }
  hide();

  function getKeys(node: HTMLElement) {
    let par = node.parentNode;
    let key = node.getAttribute('data-key');
    const keys = [];
    if (key) {
      // IMP: 数组的 key 需要特殊处理，符合 json diff 协议
      if (
        node.className.indexOf('jsondiffpatch-deleted') !== -1 &&
        (par as HTMLElement).className.indexOf('jsondiffpatch-node-type-array') !== -1
      ) {
        key = '_' + key;
      }
      keys.unshift(key);
      while (par && par !== canvas) {
        key = (par as HTMLElement).getAttribute('data-key');
        if (key) {
          keys.unshift(key);
        }
        par = par.parentNode;
      }
    }
    return keys;
  }

  /** 所有选中的 key */
  let allSelectedIndexes: string[][] = [];
  /** 所有被排除的 key */
  let allExcludedIndexes: string[][] = [];
  function getAllSelect() {
    allSelectedIndexes = [];
    allExcludedIndexes = [];
    return [].filter.call(
      document.querySelectorAll(`.${ChangedClassName}`) || [],
      (item: HTMLInputElement) => {
        if (item.checked) {
          allSelectedIndexes.push(item.value.split(keySeparator));
        } else {
          allExcludedIndexes.push(item.value.split(keySeparator));
        }
        return item.checked;
      }
    );
  }

  function getAllChanged() {
    return (
      document.querySelectorAll(
        'li[data-key]:not(.jsondiffpatch-unchanged):not(.jsondiffpatch-node)'
      ) || []
    );
  }

  function onAddChecked(value: string) {
    const [type, key] = value.split(keySeparator);
    const definitions = newVersion[type][key];
    const deps = Autos.exports.getExplicitModelDeps(definitions);
    if (deps) {
      const resolvedDeps: any = {};
      Autos.exports.resolveModelDeps(deps, definitions, resolvedDeps);
      Object.keys(resolvedDeps).forEach(model => {
        const input: HTMLInputElement | null = document.querySelector(
          `input[value='definitions${keySeparator}${model}']`
        );
        if (input) {
          input.checked = true;
          setCount();
        }
      });
    }
  }

  const allChanged = getAllChanged();
  [].forEach.call(allChanged, (node: HTMLElement) => {
    const input = document.createElement('input');
    input.className = ChangedClassName;
    input.type = 'checkbox';
    input.value = getKeys(node).join(keySeparator);
    input.onclick = (e: MouseEvent) => {
      if (
        e.shiftKey &&
        (e.target as HTMLInputElement).checked &&
        ((e.target as HTMLInputElement).parentNode as HTMLLIElement).className.indexOf(
          'jsondiffpatch-added'
        ) !== -1
      ) {
        onAddChecked((e.target as HTMLInputElement).value);
      }
      setCount();
    };
    node.insertBefore(input, node.firstChild);
    const handleClick = (e: Event) => {
      input.checked = !input.checked;
      if (input.checked) {
        if (
          (e as MouseEvent).shiftKey &&
          (input.parentNode as HTMLLIElement).className.indexOf('jsondiffpatch-added') !== -1
        ) {
          onAddChecked(input.value);
        }
      }
      setCount();
    };
    (node.querySelector('.jsondiffpatch-value') as HTMLButtonElement).onclick = handleClick;
    const key = node.querySelector('.jsondiffpatch-property-name') as HTMLButtonElement;
    if (key) {
      key.onclick = handleClick;
    }
  });

  setCount();

  /** 让 server 端应用被选中的更新 */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  function patch() {
    if (!allSelectedIndexes.length) {
      if (!confirm('忽略所有远程变动？')) {
        return;
      }
    }
    const xhr = new XMLHttpRequest();

    xhr.open('POST', '/patch');
    xhr.setRequestHeader('Content-Type', 'application/json');
    xhr.send(
      JSON.stringify({ version: diffVersion, keys: allSelectedIndexes, unkeys: allExcludedIndexes })
    );

    xhr.onreadystatechange = function () {
      if (xhr.readyState === 4) {
        try {
          const res = JSON.parse(xhr.response);
          if (res.code) {
            throw res.message;
          } else {
            if (confirm('同步成功，可以重新生成 service 了——关闭当前窗口？')) {
              // @IMP: f**k 2 ok
              window.close();
              window.close();
            }
          }
        } catch (e) {
          alert('失败：' + (e.message || e));
        }
      }
    };
    xhr.onload = function () {
      if (xhr.status !== 200) {
        alert('同步失败');
      }
    };

    xhr.onerror = function (e) {
      alert('同步失败：' + e && e['message']);
    };
  }
}
