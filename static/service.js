{
  /* eslint-disable no-undef */
  const title = (document.title = 'tkit service swagger 增量同步工具');
  const ChangedClass = 'select-change';
  const keySeparator = '@@__S__@@';

  const canvas = document.querySelector('#canvas');
  const menu = document.querySelector('#menu');

  function hide() {
    jsondiffpatch.formatters.html.hideUnchanged();
  }
  function show() {
    jsondiffpatch.formatters.html.showUnchanged();
  }
  function toggleUnchanged(me) {
    const checked = me.checked;
    if (checked) {
      show();
    } else {
      hide();
    }
  }
  function toggleSelectAll(me) {
    const checked = me.checked;
    const allChangedInput = document.querySelectorAll(`.${ChangedClass}`);
    if (allChangedInput) {
      [].forEach.call(allChangedInput, node => {
        node.checked = checked;
      });
    }
    setCount();
  }

  menu.innerHTML = [
    ['显示所有', 'toggleUnchanged'],
    ['全/全不选', 'toggleSelectAll'],
    ['保存', 'patch', '', 'button']
  ].reduce((html, item) => {
    const name = item[2] || item[0];
    html += item[3]
      ? `
      <button id="${name}" onClick="${item[1]}(this)" type="checkbox" name="${name}">${name}</button>
    `
      : `
    <input id="${name}" onClick="${item[1]}(this)" type="checkbox" name="${name}"><label for="${name}">${item[0]}</label>
    `;
    return html;
  }, `<b>${title}</b>`);
  const counter = document.createElement('div');
  counter.className = 'select-count';
  menu.appendChild(counter);

  function setCount() {
    counter.innerHTML = `已选：${getAllSelect().length} / ${getAllChanged().length}`;
  }

  canvas.innerHTML = jsondiffpatch.formatters.html.format(delta, curVersion);
  hide();

  function getKeys(node) {
    let par = node.parentNode;
    let key = node.getAttribute('data-key');
    const keys = [];
    if (key) {
      keys.unshift(key);
      while (par && par !== canvas) {
        key = par.getAttribute('data-key');
        par = par.parentNode;
        if (key) {
          keys.unshift(key);
        }
      }
    }
    return keys;
  }

  let allSelectedIndexes = [];
  function getAllSelect() {
    allSelectedIndexes = [];
    return [].filter.call(document.querySelectorAll(`.${ChangedClass}`) || [], item => {
      if (item.checked) {
        allSelectedIndexes.push(item.value.split(keySeparator));
      }
      return item.checked;
    });
  }

  function getAllChanged() {
    return (
      document.querySelectorAll(
        'li[data-key]:not(.jsondiffpatch-unchanged):not(.jsondiffpatch-node)'
      ) || []
    );
  }

  const allChanged = getAllChanged();
  [].forEach.call(allChanged, node => {
    const input = document.createElement('input');
    input.className = ChangedClass;
    input.type = 'checkbox';
    input.value = getKeys(node).join(keySeparator);
    input.onchange = () => {
      setCount();
    };
    node.insertBefore(input, node.firstChild);
    const handleClick = () => {
      input.checked = !input.checked;
      setCount();
    };
    node.querySelector('.jsondiffpatch-value').onclick = handleClick;
    const key = node.querySelector('.jsondiffpatch-property-name');
    if (key) {
      key.onclick = handleClick;
    }
  });

  setCount();

  function patch() {
    if (!allSelectedIndexes.length) {
      if (!confirm('忽略所有远程变动？')) {
        return;
      }
    }
    const xhr = new XMLHttpRequest();

    xhr.open('POST', '/patch');
    xhr.setRequestHeader('Content-Type', 'application/json');
    xhr.send(JSON.stringify({ version: diffVersion, keys: allSelectedIndexes }));

    xhr.onreadystatechange = function() {
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
    xhr.onload = function() {
      if (xhr.status !== 200) {
        alert('同步失败');
      }
    };

    xhr.onerror = function(e) {
      alert('同步失败：' + e && e.message);
    };
  }
}
