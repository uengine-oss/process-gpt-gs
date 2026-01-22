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

    cy.get('.cp-start').click();

    // Login
    cy.get('.cp-id input').clear();
    cy.get('.cp-id').type(email);
    cy.wait(1000);
    cy.get('.cp-pwd input').clear();
    cy.get('.cp-pwd').type(password);
    cy.wait(1000);
    cy.get('.cp-login').click();
    cy.wait(10000);

    // Process Menu Open
    cy.get('.cp-menu').eq(3).click({force: true});
    cy.wait(20000);

    // Process Modeling - pool
    cy.get('.bpmn-icon-participant').dblclick();
    cy.wait(1000);
    cy.get('body').click({x: 600, y: 400});
    cy.wait(1000);
    cy.get('.bpmn-icon-lane-divide-three').click();

    // Process Modeling - lane
    cy.get('body').dblclick({x: 390, y: 320});
    cy.wait(500);
    cy.get('body').type("사용자{enter}");
    cy.wait(500);

    cy.get('body').dblclick({x: 390, y: 400});
    cy.wait(500);
    cy.get('body').type("관리자{enter}");
    cy.wait(500);

    cy.get('body').dblclick({x: 390, y: 480});
    cy.wait(500);
    cy.get('body').type("담당자{enter}");
    cy.wait(500);

    // Process Modeling - start event
    cy.get('.bpmn-icon-start-event-none').dblclick();
    cy.wait(500);
    cy.get('body').click({x: 400, y: 310});
    cy.wait(500);
    cy.get('.bpmn-icon-task').eq(0).click();
    cy.wait(500);
    
    // Process Modeling - task
    cy.get('body').type("장애 신고{enter}");
    cy.wait(500);
    cy.get('.bpmn-icon-task').eq(0).click();

    cy.get('body').type("담당자 지정{enter}");
    cy.wait(500);
    cy.get('.bpmn-icon-task').eq(0).click();
    cy.wait(500);

    cy.get('body').type("장애 처리{enter}");
    cy.wait(500);
    cy.get('.bpmn-icon-task').eq(0).click();

    cy.get('body').type("처리 결과 안내{enter}");
    cy.wait(500);

    // Process Modeling - end event
    cy.get('.bpmn-icon-end-event-none').eq(0).click();

    // Process Variables
    cy.get('.cp-process-variables').click();
    cy.wait(500);
    cy.get('.cp-variables-add').click();
    cy.wait(500);
    cy.get('.cp-v-name').type("troubleDesc");
    cy.wait(500);
    cy.get('.cp-v-type').click();
    cy.wait(500);
    cy.get('body').contains('Text').click();
    cy.get('.cp-v-add').eq(1).click({force: true});
    
    // cy.get('.cp-v-name').type("troubleType");
    // cy.wait(500);
    // cy.get('.cp-v-type').eq(1).click();
    // cy.wait(500);
    // cy.get('.cp-v-type').contains('Text').click();
    // cy.get('.cp-v-add').eq(1).click({force: true});
    
    // cy.get('.cp-v-name').type("troubleResult");
    // cy.wait(500);
    // cy.get('.cp-v-type').eq(0).click();
    // cy.wait(500);
    // cy.get('body').contains('Text').click();
    // cy.get('.cp-v-add').eq(1).click({force: true});
    
    // cy.get('.cp-v-name').type("selectManeger");
    // cy.wait(500);
    // cy.get('.cp-v-type').eq(0).click();
    // cy.wait(500);
    // cy.get('body').contains('Text').click();
    // cy.get('.cp-v-add').eq(1).click({force: true});

    cy.get('.cp-v-close').click();
    cy.wait(500);
    cy.get('.cp-def-menu').click();
    cy.wait(500);
    cy.get('.cp-def-save').click({force: true});
    
    



    // save
    // cy.get('.cp-dialog-open').click();
    // cy.wait(3000);
  })
})