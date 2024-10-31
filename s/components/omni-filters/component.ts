import {Op, html} from "@benev/slate"
import {filters} from "fabric"

import {styles} from "./styles.js"
import {shadow_component} from "../../context/context.js"
import {StateHandler} from "../../views/state-handler/view.js"
import {ImageEffect, VideoEffect} from "../../context/types.js"
import {FilterType, IgnoredFilters} from "../../context/controllers/compositor/parts/filter-manager.js"

export const OmniFilters = shadow_component(use => {
	use.watch(() => use.context.state)
	use.styles(styles)
	const controllers = use.context.controllers
	const filtersManager = controllers.compositor.managers.filtersManager

	const selectedImageOrVideoEffect = use.context.state.selected_effect?.kind === "video" || use.context.state.selected_effect?.kind === "image"
		? use.context.state.effects.find(effect => effect.id === use.context.state.selected_effect!.id)! as ImageEffect | VideoEffect
		: null

	use.mount(() => {
		const dispose = filtersManager.onChange(() => use.rerender())
		return () => dispose()
	})

	const imageAndVideoEffects = () => use.context.state.effects.filter(effect => effect.kind === "image" || effect.kind === "video") as VideoEffect[] | ImageEffect[]
	const renderEffectSelectionDropdown = () => {
		return html`
			<label for="clip"></label>
			<select
				@change=${(event: Event) => {
					const target = event.target as HTMLSelectElement
					const effectId = target.value
					const effect = use.context.state.effects.find(effect => effect.id === effectId)
					controllers.timeline.set_selected_effect(effect, use.context.state)
				}}
				id="clip"
				name="clip"
			>
				<option .selected=${!selectedImageOrVideoEffect} value=none>none</option>
				${imageAndVideoEffects().map(effect => html`<option .selected=${selectedImageOrVideoEffect?.id === effect.id} value=${effect.id}>${effect.name}</option>`)}
			</select>
		`
	}

	const renderFilters = () => {
		const filterNames: FilterType[] = []
		for(const filterName in filters) {
			const fname = filterName as FilterType
			if(!IgnoredFilters.includes(fname))
				filterNames.push(fname)
		}
		return filterNames.map(filterName => {
			const filter = new filters[filterName]()
			const hasNumberParameter = typeof filter.getMainParameter() === "number"
			return html`
			<div>
				<div
					class="filter"
					?data-selected=${filtersManager.selectedFilterForEffect(selectedImageOrVideoEffect!, filterName)}
					@pointerdown=${(e: PointerEvent) => {
						e.preventDefault()
						filtersManager.addFilterToEffect(selectedImageOrVideoEffect!, filterName)
					}}
				>
					${filterName}
				</div>
				${hasNumberParameter
					? html`
						<div class=filter-intensity>
							<span>Intensity</span>
							<input
								@change=${(v: InputEvent) => filtersManager.updateEffectFilter(selectedImageOrVideoEffect!, filterName, +(v.target as HTMLInputElement).value)}
								type="range" min="-1" max="1" value="0.75" step="0.01" class="slider" id="myRange"
							>
						</div>
					`
					: null
				}
			</div>
		`})
	}

	return StateHandler(Op.all(
		use.context.is_webcodecs_supported.value,
		use.context.helpers.ffmpeg.is_loading.value), () => html`
		<div class=box>
			${renderEffectSelectionDropdown()}
			${selectedImageOrVideoEffect
				? html`<div>add filter for: ${selectedImageOrVideoEffect.name}</div>`
				: html`<div>select video or image either from dropdown menu here, timeline or scene</div>`
			}
			<div class="filters" ?disabled=${!selectedImageOrVideoEffect}>
				${renderFilters()}
			</div>
		</div>
	`)
})
