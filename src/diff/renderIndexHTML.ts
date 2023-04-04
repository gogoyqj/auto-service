export default function renderIndexHTML(fragment: string): string {
  return `
<html>
  <head>
    <link rel="stylesheet" href="/static/html.css">
    <link rel="stylesheet" href="/static/annotated.css">
    <link rel="stylesheet" href="/static/service.css">
    <script src="/static/jsondiffpatch.umd.js"></script>
  </head>
  <body>
    <div id="menu" class="menu"></div>
    <div id="canvas" class="canvas"></div>
    <script>
      ${fragment}
      window.require = function (module) {
        return window.Autos;
      }
      window.module = window.Autos = {
        exports: {}
      };
      window.exports = window.Autos.exports;        
    </script>
    <script src="/static/src/utils/getModelDeps.js"></script>
    <script src="/static/static/service.js"></script>
  </body>
</html>
`;
}
