if [ -d docs ]; then
  files=$(find src -name "*.md*")" "$(ls *.md*)

  for file in $files; do
    if [ -f $file ]; then
      content=$(grep -o -e "route: [^ ]\+" $file)
      tar=$(node -e "console.log('${content}'.replace(/route: /g, ''))")
      trimed=$(node -e "console.log('${tar}'.replace(\"/\", \"\"))")
      if [ "$trimed" != "" ]; then
        mkdir -p docs/$tar
        cp -f docs/index.html docs/$tar/index.html
      fi
    fi
  done
fi
