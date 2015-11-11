import Ember from 'ember';
import Schema from 'ember-json-schema/models/schema';

// For now, just import schemas statically and map the selected DEs and providers
// When Gridiron is able to serve schemas, this will be replaced with API calls
// to load previous step's selections
import aptibleSchema from 'sheriff/schemas/providers/aptible'
import awsSchema from 'sheriff/schemas/providers/aws'
import googleSchema from 'sheriff/schemas/providers/google'
import ebsSchema from 'sheriff/schemas/data-environments/ebs'
import ec2Schema from 'sheriff/schemas/data-environments/ec2'
import elbSchema from 'sheriff/schemas/data-environments/elb'
import glacierSchema from 'sheriff/schemas/data-environments/glacier'
import gmailSchema from 'sheriff/schemas/data-environments/gmail'
import googleDocsSchema from 'sheriff/schemas/data-environments/google-docs'
import googleDriveSchema from 'sheriff/schemas/data-environments/google-drive'
import laptopsSchema from 'sheriff/schemas/data-environments/laptops'
import onPremiseSchema from 'sheriff/schemas/data-environments/on-premise'
import paperSchema from 'sheriff/schemas/data-environments/paper'
import phoneSchema from 'sheriff/schemas/data-environments/phone'
import redshiftSchema from 'sheriff/schemas/data-environments/redshift'
import s3Schema from 'sheriff/schemas/data-environments/s3'
import usbSchema from 'sheriff/schemas/data-environments/usb'
import workstationsSchema from 'sheriff/schemas/data-environments/workstations'
export var schemaMap = {
  providers: {
    aptible: aptibleSchema,
    aws: awsSchema,
    google: googleSchema
  },
  dataEnvironments: {
    ebs: ebsSchema,
    ec2: ec2Schema,
    glacier: glacierSchema,
    gmail: gmailSchema,
    'google-docs': googleDocsSchema,
    'google-drive': googleDriveSchema,
    laptops: laptopsSchema,
    'on-premise': onPremiseSchema,
    paper: paperSchema,
    phone: phoneSchema,
    redshift: redshiftSchema,
    s3: s3Schema,
    usb: usbSchema,
    workstations: workstationsSchema
  }
};

function selectedProviders(dataEnvironments) {
  // From a set of provided DEs, determine which providers are being used
  return dataEnvironments
         .filter((d) => d.provider)
         .map((d) => d.provider)
         .uniq()
         .without('aptible');
}

function getSecurityControlGroups(dataEnvironments) {
  // Given a collection of data environments, collect DEs by provider, flatten,
  // and map to imported schemas
  let securityControlGroups = [];
  let providers = selectedProviders(dataEnvironments);

  providers.forEach((provider) => {
    let providerDataEnvironments = dataEnvironments.filter((de) => {
      return de.provider === provider
    }).map((dataEnvironment) => {
      return {
        schema: schemaMap.dataEnvironments[dataEnvironment.handle],
        dataEnvironment
      };
    });

    securityControlGroups.push({
      schema: schemaMap.providers[provider],
    });

    securityControlGroups = securityControlGroups.concat(providerDataEnvironments);
  });

  securityControlGroups.push({ schema: schemaMap.providers.aptible });
  securityControlGroups.map((controlGroup) => {
    let schema = new Schema(controlGroup.schema);
    let document = schema.buildDocument();
    let dataEnvironment = controlGroup.dataEnvironment || false;

    return { schema, document, dataEnvironment };
  });

  return securityControlGroups;
}

export default Ember.Route.extend({
  beforeModel() {
    let profile = this.modelFor('setup');
    let selectedDataEnvironments = profile.get('selectedDataEnvironments');

    if(!selectedDataEnvironments || !selectedDataEnvironments.length) {
      return this.transitionTo('setup.data-environments');
    }
  },

  model() {
    let profile = this.modelFor('setup');
    let selectedDataEnvironments = profile.get('selectedDataEnvironments');

    return getSecurityControlGroups(selectedDataEnvironments);
  }
});

