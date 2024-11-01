import {Actions} from "../../actions.js"
import {Media} from "../media/controller.js"
import {Compositor} from "../compositor/controller.js"
import {EffectManager} from "./parts/effect-manager.js"
import {PlayheadDrag} from "./parts/drag-related/playhead-drag.js"
import {effectTrimHandler} from "./parts/drag-related/effect-trim.js"
import {EffectDragHandler} from "./parts/drag-related/effect-drag.js"
import {EffectPlacementProposal} from "./parts/effect-placement-proposal.js"
import {ProposedTimecode, AnyEffect, EffectTimecode, State} from "../../types.js"

/**
	* The Timeline class orchestrates the main actions for the video editor’s timeline.
	* It uses other specialized classes to handle specific logic related to effects,
	* canvas interactions, and drag actions, serving as the primary controller for 
	* timeline management.
*/
export class Timeline {
	effectTrimHandler: effectTrimHandler
	effectDragHandler = new EffectDragHandler()
	playheadDragHandler = new PlayheadDrag()
	#placementProposal: EffectPlacementProposal
	#effectManager: EffectManager

	constructor(private actions: Actions, media: Media, private compositor: Compositor) {
		this.effectTrimHandler = new effectTrimHandler(actions)
		this.#placementProposal = new EffectPlacementProposal()
		this.#effectManager = new EffectManager(actions, compositor, media)
	}

	/**
		* Calculates a proposed timecode for an effect's placement, considering overlaps
		* and positioning on the timeline.
		*
		* @param effectTimecode - The start and end time of the effect to place.
		* @param grabbed_effect_id - The ID of the effect currently being dragged.
		* @param state - The current application state.
		* @returns A ProposedTimecode object containing the suggested placement and any adjustments.
	*/
	calculate_proposed_timecode(effectTimecode: EffectTimecode, grabbed_effect_id: string, state: State): ProposedTimecode {
		return this.#placementProposal.calculateProposedTimecode(effectTimecode, grabbed_effect_id, state)
	}

	/**
		* Sets the proposed timecode for an effect based on the calculated proposal, adjusting
		* the effect’s start position, track, and duration if needed.
		*
		* @param effect - The effect to update with a new timecode.
		* @param proposedTimecode - The calculated timecode proposal for placement.
	*/
	set_proposed_timecode(effect: AnyEffect, proposedTimecode: ProposedTimecode) {
		this.#effectManager.setProposedTimecode(effect, proposedTimecode)
	}

	/**
		* Removes the currently selected effect from the application state, both
		* compositor and timeline will reflect this removal
		*
		* @param state - The current application state, which includes the selected effect.
	*/
	remove_selected_effect(state: State) {
		if (state.selected_effect) {
			this.#effectManager.removeEffect(state.selected_effect)
		}
	}

	/**
		* Sets the selected effect in the application state, allowing both the timeline
		* and the compositor canvas to reflect the selection.
		*
		* @param effect - The effect to set as selected, or undefined to clear the selection.
		* @param state - The current application state, where the selected effect will be updated.
	*/
	set_selected_effect(effect: AnyEffect | undefined, state: State) {
		this.#effectManager.setSelectedEffect(effect, state)
	}

	/**
		* Sets or discards the active object on the canvas based on the specified effect.
		*
		* @param effect - The effect to activate or discard on the canvas.
		* @param state - The current application state.
	*/
	setOrDiscardActiveObjectOnCanvas(effect: AnyEffect, state: State) {
		this.compositor.setOrDiscardActiveObjectOnCanvas(effect, state)
	}

	/**
		* Splits the selected effect or, if none is selected, splits the first effect found
		* at the current timestamp. The original effect is updated, and a new effect is created
		* at the split point.
		*
		* @param state - The current application state.
	*/
	split(state: State) {
		this.#effectManager.splitEffectAtTimestamp(state)
	}
}
