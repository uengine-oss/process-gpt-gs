///<reference types="cypress" />
import 'cypress-drag-drop';
require('@4tw/cypress-drag-drop');

// ***********************************************
// This example commands.ts shows you how to
// create various custom commands and overwrite
// existing commands.
//
// For more comprehensive examples of custom
// commands please read more here:
// https://on.cypress.io/custom-commands
// ***********************************************
//
//
// -- This is a parent command --
// Cypress.Commands.add('login', (email, password) => { ... })
//
//
// -- This is a child command --
// Cypress.Commands.add('drag', { prevSubject: 'element'}, (subject, options) => { ... })
//
//
// -- This is a dual command --
// Cypress.Commands.add('dismiss', { prevSubject: 'optional'}, (subject, options) => { ... })
//
//
// -- This will overwrite an existing command --
// Cypress.Commands.overwrite('visit', (originalFn, url, options) => { ... })
//
// declare global {
//   namespace Cypress {
//     interface Chainable {
//       login(email: string, password: string): Chainable<void>
//       drag(subject: string, options?: Partial<TypeOptions>): Chainable<Element>
//       dismiss(subject: string, options?: Partial<TypeOptions>): Chainable<Element>
//       visit(originalFn: CommandOriginalFn, url: string, options: Partial<VisitOptions>): Chainable<Element>
//     }
//   }
// }

declare global {
  namespace Cypress {
    interface Chainable {
      clickAt(x: number, y: number): Chainable<void>;
    }
  }
}

Cypress.Commands.add('drag', { prevSubject: 'element' }, (subject, options: { x: number, y: number }) => {
  const { x, y } = options;

  cy.wrap(subject)
    .trigger('mousedown', { which: 1 , force: true})
    .trigger('mousemove', { clientX: x, clientY: y, force: true })
    .trigger('mouseup', { force: true });
});


// Cypress.Commands.add('dragToPosition', { prevSubject: 'element' }, (subject: JQuery<HTMLElement>, x: number, y: number) => {
//   cy.wrap(subject)
//     .trigger('mousedown', { which: 1, force: true })
//     .trigger('mousemove', { clientX: x, clientY: y, force: true })
//     .trigger('mouseup', { force: true });
// });

Cypress.Commands.add('clickAt', (x: number, y: number) => {
  cy.window().then((win) => {
    const element = win.document.elementFromPoint(x, y);
    if (element) {
      cy.wrap(element).click({ force: true });
    } else {
      throw new Error(`No element found at (${x}, ${y})`);
    }
  });
});