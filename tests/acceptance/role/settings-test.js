import Ember from 'ember';
import {
  module,
  test
} from 'qunit';
import startApp from 'diesel/tests/helpers/start-app';
// import { stubRequest } from '../../helpers/fake-server';

let application;
// let orgId = 'o1';
let roleId = 'r1';
// let roleName = 'the-role';
let url = `/roles/${roleId}/members`;
// let apiRoleUrl = `/roles/${roleId}`;
// let apiRoleUsersUrl = `/roles/${roleId}/users`;
// let apiUsersUrl = `/organizations/${orgId}/users`;

module('Acceptance: Role Settings', {
  beforeEach: function() {
    application = startApp();
    stubOrganizations();
    stubStacks();
  },

  afterEach: function() {
    Ember.run(application, 'destroy');
  }
});

test(`visiting ${url} requires authentication`, () => {
  expectRequiresAuthentication(url);
});
