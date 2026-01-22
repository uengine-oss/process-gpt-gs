const email = Cypress.env('EMAIL');
const password = Cypress.env('PASSWORD');

Cypress.on('uncaught:exception', (err, runnable) => {
  return false;
});

describe('프로세스 정의', () => {
  beforeEach(() => {
    cy.visit('http://127.0.0.1:5173/', {
      onBeforeLoad: (window) => {
        window.localStorage.setItem('execution', true);
      }
    });
  });

  it('passes', () => {

    cy.get('.cp-start').click({force: true});

    // Login
    cy.get('.cp-id input').clear();
    cy.get('.cp-id').type(email);
    cy.wait(1000);
    cy.get('.cp-pwd input').clear();
    cy.get('.cp-pwd').type(password);
    cy.get('.cp-login').click();
    cy.wait(1000);

    // check-out 
    cy.get('.cp-unlock').click({force: true});
    cy.wait(1000);
    cy.get('.cp-check-out').click();
    cy.wait(1000);
   
    // Mega Process
    cy.get('.cp-add-mega').click();
    cy.wait(1000);
    cy.get('.cp-process-id').type("고객{enter}");
    cy.wait(2000);

    // Major Process
    cy.get('.cp-mega').click();
    cy.wait(1500);
    cy.get('.cp-add-major').click({force: true});
    cy.wait(1500);
    cy.get('.cp-process-id').eq(0).type("고객정보관리{enter}");
    cy.wait(1500);

    cy.get('.cp-process-id').eq(0).type("{selectAll}{del}고객상담관리{enter}");
    cy.wait(1500);

    cy.get('.cp-process-id').eq(0).type("{selectAll}{del}고객정보보호{enter}");
    cy.wait(1500);

    // Sub Process
    cy.get('.cp-major').eq(0).click();
    cy.wait(1500);
    cy.get('.cp-add-sub').click({force: true});
    cy.wait(1500);
    cy.get('.cp-custom-sub label').click();
    cy.wait(1500);
    cy.get('.cp-process-name').type("{selectAll}{del}고객정보관리{enter}");
    cy.wait(1500);
    cy.get('.cp-process-save').click();
    cy.wait(1500);

    cy.get('.cp-major').eq(0).click();
    cy.get('.cp-add-sub').click({force: true});
    cy.wait(1500);
    cy.get('.cp-custom-sub label').click();
    cy.wait(1500);
    cy.get('.cp-process-name').type("{selectAll}{del}멤버쉽관리{enter}");
    cy.wait(1500);
    cy.get('.cp-process-save').click();
    cy.wait(1500);

    cy.get('.cp-major').eq(1).click();
    cy.wait(1500);
    cy.get('.cp-add-sub').eq(1).click({force: true});
    cy.wait(1500);
    cy.get('.cp-custom-sub label').click();
    cy.wait(1500);
    cy.get('.cp-process-name').type("{selectAll}{del}고객센터 상담관리{enter}");
    cy.wait(1500);
    cy.get('.cp-process-save').click();
    cy.wait(1500);

    cy.get('.cp-major').eq(2).click();
    cy.wait(1500);
    cy.get('.cp-add-sub').eq(2).click({force: true});
    cy.wait(1500);
    cy.get('.cp-custom-sub label').click();
    cy.wait(1500);
    cy.get('.cp-process-name').type("{selectAll}{del}고객정보 보호{enter}");
    cy.wait(1500);
    cy.get('.cp-process-save').click();
    cy.wait(1500);

    cy.get('.cp-major').eq(2).click();
    cy.get('.cp-add-sub').eq(2).click({force: true});
    cy.wait(1500);
    cy.get('.cp-custom-sub label').click();
    cy.wait(1500);
    cy.get('.cp-process-name').type("{selectAll}{del}고객정보 파기{enter}");
    cy.wait(1500);
    cy.get('.cp-process-save').click();
    cy.wait(1500);

    // check-in
    cy.get('.cp-lock').click();
    cy.wait(1000);
    cy.get('.cp-check-in').click();


  })
})