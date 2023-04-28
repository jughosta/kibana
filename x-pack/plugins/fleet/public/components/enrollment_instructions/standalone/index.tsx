/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */
import type { CommandsByPlatform } from '../../../applications/fleet/components/fleet_server_instructions/utils/install_command_utils';

export const StandaloneInstructions = (kibanaVersion: string): CommandsByPlatform => {
  const linuxDebCommand = `curl -L -O https://artifacts.elastic.co/downloads/beats/elastic-agent/elastic-agent-${kibanaVersion}-amd64.deb
sudo dpkg -i elastic-agent-${kibanaVersion}-amd64.deb \nsudo systemctl enable elastic-agent \nsudo systemctl start elastic-agent`;

  const linuxRpmCommand = `curl -L -O https://artifacts.elastic.co/downloads/beats/elastic-agent/elastic-agent-${kibanaVersion}-x86_64.rpm
sudo rpm -vi elastic-agent-${kibanaVersion}-x86_64.rpm \nsudo systemctl enable elastic-agent \nsudo systemctl start elastic-agent`;

  const linuxCommand = `curl -L -O https://artifacts.elastic.co/downloads/beats/elastic-agent/elastic-agent-${kibanaVersion}-linux-x86_64.tar.gz
tar xzvf elastic-agent-${kibanaVersion}-linux-x86_64.tar.gz
cd elastic-agent-${kibanaVersion}-linux-x86_64
sudo ./elastic-agent install`;

  const macCommand = `curl -L -O https://artifacts.elastic.co/downloads/beats/elastic-agent/elastic-agent-${kibanaVersion}-darwin-x86_64.tar.gz
tar xzvf elastic-agent-${kibanaVersion}-darwin-x86_64.tar.gz
cd elastic-agent-${kibanaVersion}-darwin-x86_64
sudo ./elastic-agent install`;

  const windowsCommand = `$ProgressPreference = 'SilentlyContinue'
Invoke-WebRequest -Uri https://artifacts.elastic.co/downloads/beats/elastic-agent/elastic-agent-${kibanaVersion}-windows-x86_64.zip -OutFile elastic-agent-${kibanaVersion}-windows-x86_64.zip
Expand-Archive .\elastic-agent-${kibanaVersion}-windows-x86_64.zip -DestinationPath .
cd elastic-agent-${kibanaVersion}-windows-x86_64
.\\elastic-agent.exe install`;

  const k8sCommand = 'kubectl apply -f elastic-agent-standalone-kubernetes.yml';

  return {
    linux: linuxCommand,
    mac: macCommand,
    windows: windowsCommand,
    deb: linuxDebCommand,
    rpm: linuxRpmCommand,
    kubernetes: k8sCommand,
    cloudFormation: '',
  };
};
