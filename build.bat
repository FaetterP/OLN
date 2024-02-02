rmdir /s /q .git
rmdir /s /q .github
rmdir /s /q node_modules

del /s /q .gitignore
del /s /q index.js
del /s /q package.json
del /s /q package-lock.json
del /s /q README.md

tar -a -c -f OLN.zip assets pack.png pack.mcmeta
