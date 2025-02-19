// Please don't use interfaces here - messages need to be exact since we cannot afford
// accidentally serializing huge or unserializable data.

import type { Logic } from '../../logic/Logic';

/** The part of Logic that we can send across to a web worker, only the parts we need for tooltips. */
export type LeanLogic = Pick<Logic, 'allItems' | 'impliedBy' | 'itemBits'>;

/** A message from our tooltips cache to its worker. */
export type WorkerRequest =
    | {
          type: 'initialize';
          logic: LeanLogic;
          opaqueBits: number[];
          requirements: number[][][];
      }
    | {
          type: 'analyze';
          checkId: string;
      };

export type SerializedItem = string | SerializedBooleanExpression;

export type SerializedBooleanExpression = {
    type: 'and' | 'or';
    items: SerializedItem[];
};

/** A message from the worker. */
export type WorkerResponse = {
    checkId: string;
    expression: SerializedBooleanExpression;
};
