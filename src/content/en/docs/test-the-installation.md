---
title: "Test the installation"
description: "At the end, the script deletes everything that it created. To run the same test with the test suite, run TESTER_DOCKER=1 python manage.py test…"
order: 11
group: "Run"
source: "docs/installation.md"
---

The script `bash docker/test_installation.sh` reproduces an installation on a blank machine. It copies the repository
into an empty folder and runs `./install.sh`. Then it checks these points:

- The health page
- The wizard, shown in place of the sign-in page
- The static files and the compression
- The security headers
- `check --deploy` over HTTPS
- The backup
- The update, with a backup made first
- The data, kept after the update

At the end, the script deletes everything that it created. To run the same test with the test suite, run
`TESTER_DOCKER=1 python manage.py test parametres.test_hebergement`.
