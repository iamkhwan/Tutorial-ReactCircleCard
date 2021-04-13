/*
*  Power BI Visual CLI
*
*  Copyright (c) Microsoft Corporation
*  All rights reserved.
*  MIT License
*
*  Permission is hereby granted, free of charge, to any person obtaining a copy
*  of this software and associated documentation files (the ""Software""), to deal
*  in the Software without restriction, including without limitation the rights
*  to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
*  copies of the Software, and to permit persons to whom the Software is
*  furnished to do so, subject to the following conditions:
*
*  The above copyright notice and this permission notice shall be included in
*  all copies or substantial portions of the Software.
*
*  THE SOFTWARE IS PROVIDED *AS IS*, WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
*  IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
*  FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
*  AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
*  LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
*  OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
*  THE SOFTWARE.
*/
"use strict";
import powerbi from "powerbi-visuals-api";

import DataView = powerbi.DataView;
import VisualConstructorOptions = powerbi.extensibility.visual.VisualConstructorOptions;
import VisualUpdateOptions = powerbi.extensibility.visual.VisualUpdateOptions;
import IVisual = powerbi.extensibility.visual.IVisual;
import IViewport = powerbi.IViewport;

import VisualObjectInstance = powerbi.VisualObjectInstance;
import EnumerateVisualObjectInstancesOptions = powerbi.EnumerateVisualObjectInstancesOptions;
import VisualObjectInstanceEnumerationObject = powerbi.VisualObjectInstanceEnumerationObject;
import { VisualSettings } from "./settings";

//Conditional Formatting
import { dataViewWildcard } from "powerbi-visuals-utils-dataviewutils";
import VisualEnumerationInstanceKinds = powerbi.VisualEnumerationInstanceKinds;

import * as React from "react";
import * as ReactDOM from "react-dom";
import { ReactCircleCard, initialState } from "./component";

import "./../style/visual.less";

export class Visual implements IVisual {
    private target: HTMLElement;
    private reactRoot: React.ComponentElement<any, any>;
    private viewport: IViewport;
    private settings: VisualSettings;

    constructor(options: VisualConstructorOptions) {
        this.reactRoot = React.createElement(ReactCircleCard, {});
        this.target = options.element;

        ReactDOM.render(this.reactRoot, this.target);
    }

    private visualTransform = (dataView: DataView) => {
        //Set default values before overrride with visual settings.
        this.settings = VisualSettings.parse(dataView) as VisualSettings;

        if (dataView) {
            var metadata: any = dataView.metadata;
            //Get color
            if (metadata && metadata.objects && metadata.objects.circle && metadata.objects.circle.circleColor) {
                this.settings.circle.circleColor = metadata.objects.circle.circleColor.solid.color;
            }
            //Check object range of colors
            if (metadata && metadata.objectRules) {
                this.settings.circle.objectRules = metadata.objectRules;
            }
        }
    }

    public update(options: VisualUpdateOptions) {
        if (options.dataViews && options.dataViews[0]) {
            const dataView: DataView = options.dataViews[0];
            this.visualTransform(dataView);

            this.viewport = options.viewport;
            const { width, height } = this.viewport;
            const size = Math.min(width, height);
            const object = this.settings.circle;

            ReactCircleCard.update({
                textLabel: dataView.metadata.columns[0].displayName,
                textValue: dataView.single.value.toString(),
                size: size,
                borderWidth: object && object.circleThickness ? object.circleThickness : undefined,
                background: object && object.circleColor ? object.circleColor : undefined,
            });
        }
        else {
            this.clear();
        }
    }

    public enumerateObjectInstances(options: EnumerateVisualObjectInstancesOptions): VisualObjectInstance[] | VisualObjectInstanceEnumerationObject {
        let objectName = options.objectName;
        let objectEnumeration: VisualObjectInstance[] = [];

        if (!this.settings ||
            !this.settings.circle) {
            return objectEnumeration;
        }

        switch (objectName) {
            case 'circle':
                objectEnumeration.push({
                    objectName: objectName,
                    properties: {
                        circleColor: this.settings.circle.circleColor,
                        circleThickness: this.settings.circle.circleThickness
                    },
                    propertyInstanceKind: {
                        circleColor: VisualEnumerationInstanceKinds.ConstantOrRule
                    },
                    altConstantValueSelector: null,
                    selector: dataViewWildcard.createDataViewWildcardSelector(dataViewWildcard.DataViewWildcardMatchingOption.InstancesAndTotals)
                });
                break;
        };

        return objectEnumeration;
    }

    private clear() {
        ReactCircleCard.update(initialState);
    }
}