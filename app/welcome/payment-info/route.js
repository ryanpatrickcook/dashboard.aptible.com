import Ember from 'ember';
import { createStripeToken } from 'diesel/utils/stripe';
import { provisionDatabases } from 'diesel/models/database';

export const NEW_SIGNUP_EVENT_NAME = 'Account Signup';

export default Ember.Route.extend({
  analytics: Ember.inject.service(),

  setupController(controller, model) {
    controller.set('model', model);
    var firstApp = this.modelFor('welcome');
    controller.set('firstApp', firstApp);
    controller.set('saveProgress', Ember.Object.create({ totalSteps: 5, currentStep: 0 }));
  },

  actions: {
    create(model) {
      var route = this;
      var store = this.store;
      var controller = this.controllerFor('welcome/payment-info');
      var welcomeModel = this.modelFor('welcome');
      var saveProgress = controller.get('saveProgress');

      var options = {
        name: model.name,
        number: model.number,
        exp_month: model.expMonth,
        exp_year: model.expYear,
        cvc: model.cvc,
        address_zip: model.zip
      };

      let organization = this.modelFor('welcome').organization;
      let stripeResponse;
      let pendingSubscription;

      saveProgress.set('currentStep', 1);

      createStripeToken(options)
      .then(function(stripeToken) {
        stripeResponse = stripeToken;
        // A billing detail should not be found
        // If one is found, then we should skip creating a new one
        return store.find('billing-detail', organization.get('id')).catch(Ember.$.noop);
      }).then(function(result) {
        saveProgress.set('currentStep', 2);

        if(result) {
          // Don't create another subscription if the organization already
          // has one
          return Ember.RSVP.resolve();
        }

        pendingSubscription = store.createRecord('billing-detail', {
          id: organization.get('id'),
          plan: welcomeModel.plan,
          stripeToken: stripeResponse.id,
          organization
        });

        return pendingSubscription.save();
      }).then(function(billingDetail){
        organization.set('billingDetail', billingDetail);
        saveProgress.set('currentStep', 3);

        return store.createRecord('stack', {
          handle: welcomeModel.stackHandle,
          type: model.plan === 'development' ? 'development' : 'production',
          organization: organization
        }).save();
      }).then(function(stack) {
        var promises = [];

        saveProgress.set('currentStep', 4);

        if (welcomeModel.appHandle) {
          var app = store.createRecord('app', {
            handle: welcomeModel.appHandle,
            stack: stack
          });
          promises.push(app.save());
        }

        if (welcomeModel.dbHandle) {
          var db = store.createRecord('database', {
            handle: welcomeModel.dbHandle,
            type: welcomeModel.dbType,
            initialDiskSize: welcomeModel.initialDiskSize,
            stack: stack
          });
          promises.push(db.save());
        }

        return Ember.RSVP.all(promises);
      }).then(function(){
        saveProgress.set('currentStep', 5);
        let currentUser = route.session.get('currentUser');

        return provisionDatabases(currentUser, route.store);
      }).then(function() {

        let currentUser = route.session.get('currentUser');
        let eventTraits = {
          plan: welcomeModel.plan,
          organization_id: organization.get('id'),
          created_by_user_name: currentUser.get('name'),
          created_by_user_email: currentUser.get('email'),
          created_by_user_id: currentUser.get('id')
        };

        if(welcomeModel.appHandle) {
          eventTraits.app_handle = welcomeModel.appHandle;
        }

        if(welcomeModel.dbHandle) {
          eventTraits.database_handle = welcomeModel.dbHandle;
        }

        route.get('analytics').track(NEW_SIGNUP_EVENT_NAME, eventTraits);

        saveProgress.set('currentStep', 6);
        route.transitionTo('index');
      }, function(error) {
        error = error.message || error.responseJSON.message;
        saveProgress.set('currentStep', 0);
        controller.set('error', error);

        if(pendingSubscription && pendingSubscription.get('isDirty')) {
          pendingSubscription.deleteRecord();
        }
      });
    }
  }
});
