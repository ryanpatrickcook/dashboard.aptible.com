export default function(){
  // this.transition(
  //   this.fromRoute('organization.setup.start'),
  //   this.toRoute('organization.setup.organization'),
  //   this.use('toLeft'),
  //   this.reverse('toRight')
  // );

  // this.transition(
  //   this.fromRoute('organization.setup.organization'),
  //   this.toRoute('organization.setup.locations'),
  //   this.use('toLeft'),
  //   this.reverse('toRight')
  // );
  this.transition(
    this.fromRoute('setup.start'),
    this.toRoute('setup.organization'),
    this.use('toLeft'),
    this.debug()
  );
  this.transition(
    this.fromRoute('setup.organization'),
    this.toRoute('setup.locations'),
    this.use('toLeft'),
    this.debug()
  );
  this.transition(
    this.fromRoute('setup.locations'),
    this.toRoute('setup.team'),
    this.use('toLeft'),
    this.debug()
  );
  this.transition(
    this.fromRoute('setup.team'),
    this.toRoute('setup.data-environments'),
    this.use('toLeft'),
    this.debug()
  );
  this.transition(
    this.fromRoute('setup.data-environments'),
    this.toRoute('setup.security-controls'),
    this.use('toLeft'),
    this.debug()
  );
  this.transition(
    this.fromRoute('setup.security-controls'),
    this.toRoute('setup.finish'),
    this.use('toLeft'),
    this.debug()
  );
};