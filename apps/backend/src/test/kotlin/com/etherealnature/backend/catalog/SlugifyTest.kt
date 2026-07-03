package com.etherealnature.backend.catalog

import com.etherealnature.backend.catalog.application.slugify
import kotlin.test.Test
import kotlin.test.assertEquals
import kotlin.test.assertTrue

class SlugifyTest {

    @Test
    fun `lowercases and collapses non-alphanumerics into single dashes`() {
        assertEquals("lavender-essential-oil", slugify("Lavender Essential Oil"))
        assertEquals("chamomile-100g", slugify("  Chamomile — 100g!  "))
        assertEquals("a-b-c", slugify("a___b   c"))
    }

    @Test
    fun `trims leading and trailing dashes and never returns empty`() {
        assertEquals("tea", slugify("--tea--"))
        assertEquals("product", slugify("!!!"))
        assertEquals("product", slugify(""))
    }

    @Test
    fun `caps length at 100 characters`() {
        val slug = slugify("x".repeat(300))
        assertTrue(slug.length <= 100)
    }
}
