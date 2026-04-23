describe('Prepare Test Environment', function()
{
  it('Clear database', function()
  {
    cy.visit('/');
    cy.window().then((win) =>
    {
      cy.wrap(win.Meteor.callAsync('clear.database'), {timeout: 30000});
    });
  });

  it('Insert dummy data', function()
  {
    cy.visit('/');
    cy.window().then((win) =>
    {
      cy.wrap(win.Meteor.callAsync('insert.dummy.data'), {timeout: 30000});
    });
  });
});
