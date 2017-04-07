// Type definitions for React (react-addons-transition-group) 15.0
// Project: http://facebook.github.io/react/
// Definitions by: Asana <https://asana.com>, AssureSign <http://www.assuresign.com>, Microsoft <https://microsoft.com>
// Definitions: https://github.com/DefinitelyTyped/DefinitelyTyped
// TypeScript Version: 2.1

import { ComponentClass, ReactTransitionGroupProps } from 'react';

declare module 'react' {
    export interface TransitionGroupProps<T> extends HTMLAttributes<T> {
        component?: ReactType;
        childFactory?: (child: ReactElement<any>) => ReactElement<any>;
    }

    export interface ReactTransitionGroupProps extends TransitionGroupProps<ReactTransitionGroup> {
    }
}

declare var ReactTransitionGroup: ReactTransitionGroup;
type ReactTransitionGroup = ComponentClass<ReactTransitionGroupProps>;
export = ReactTransitionGroup;
