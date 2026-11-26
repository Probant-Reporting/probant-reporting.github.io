---
title: "Test the installation"
description: "This part is for the people who change the code of the tool. You do not need it to install the tool. The test scripts are in the code (folder docker/), not…"
order: 11
group: "Run"
source: "docs/installation.md"
---

This part is for the people who change the code of the tool. You do not need it to install the tool. The test
scripts are in the code (folder `docker/`), not in the folder of an installation with one command.

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

The script `bash docker/test_get.sh` tests the installation with one command. It serves a local copy of the public
repository and a local image registry, then runs `get.sh` through a pipe, as in section 2. The lists of sums of the
local releases are signed with a test key of cosign. Before, it checks the refusals: a file of the tag changed, the
list changed after its signature, and a release without a list. Then it checks the update to a newer version and the
way back to the previous version (section 6). The variables `PROBANT_TEST_SOURCE`, `PROBANT_TEST_IMAGE`,
`PROBANT_TEST_OS_RELEASE`, `PROBANT_TEST_SKIP_CHECK`, `PROBANT_TEST_COSIGN_KEY` and `PROBANT_TEST_COSIGN_IMAGE` of the
scripts are only for these tests: do not set them on a server. The two cosign variables are read only with a test
source or a test image (`PROBANT_TEST_SOURCE`, `PROBANT_TEST_IMAGE`): the files and the image of the public repository
are always verified against its identity.

The script `bash docker/test_offline.sh` tests the installation without Internet access. It makes the offline
packages of two versions with `docker/make_offline_package.sh`, from the image of the folder. Then it plays a server
without Internet access: the name of the image points to a registry where nothing answers, `curl` and `wget` fail,
Docker must download no image, and, where the system allows it, the scripts run without any network (`unshare --net`). It checks the installation (`./install.sh --offline`), the update to the second version
(`./update.sh --offline`), the refusal of an older package, and the way back to the first version (section 6).

The script `bash docker/test_custom_certificate.sh` tests the company network (section 2, “Company network”). It
creates a test certificate authority and a server certificate signed by it. Then it installs the tool with `--domain`,
`--cert`, `--key` and `--ca-cert`, and checks these points: Caddy serves this certificate (`curl --cacert`), the
health page answers through HTTPS, Caddy never contacts Let's Encrypt, the key never enters the container of the tool,
an outgoing HTTPS connection of the tool trusts the authority, and the renewal. Then it does the same without Internet
access, from an offline package. `TEST_HTTPS_PORT` and `TEST_HTTP_PORT` choose other ports than 443 and 80.

The script `bash docker/test_auto_update.sh` tests the automatic updates (section 6), with a local image registry, a
local copy of the public repository, and a test key of cosign. On one installation made by `get.sh`, it plays the
choices “Off” and “Notify only”, the wait after the publication, a missing or wrong signature, a missing or changed list
of sums, a new version that does not start (going back, with and without a restore), the lock shared with
`./update.sh`, and a successful update. It needs Docker and cosign 3 (`COSIGN_BINARY`). The signature made by the
workflow of the public repository can only be checked on GitHub, at each published version.
